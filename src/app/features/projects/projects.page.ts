import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackofficeApiService } from '../../core/services/backoffice-api.service';
import { Project } from '../../core/models/backoffice.models';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './projects.page.html',
  styleUrl: './projects.page.scss'
})
export class ProjectsPageComponent {
  private readonly api = inject(BackofficeApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly projects = signal<Project[]>([]);
  protected readonly selectedProjectId = signal<string | null>(null);
  protected readonly showModal = signal(false);
  protected readonly showInvoiceModal = signal(false);
  protected readonly selectedInvoiceProject = signal<Project | null>(null);

  protected readonly projectForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    status: ['Planning' as Project['status'], Validators.required],
    clientName: ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPhone: ['', Validators.required],
    startDate: ['', Validators.required],
    expectedCompletionDate: ['', Validators.required],
    materials: [''],
    budget: [0, Validators.min(0)],
    notes: ['']
  });

  protected readonly invoiceForm = this.fb.group({
    invoiceNumber: ['', Validators.required],
    invoiceDate: ['', Validators.required],
    dueDate: ['', Validators.required],
    billToName: ['', Validators.required],
    billToPhone: [''],
    billToEmail: [''],
    siteLocation: [''],
    notes: [''],
    items: this.fb.array([])
  });

  constructor() {
    this.loadProjects();
  }

  protected loadProjects(): void {
    this.api
      .getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => this.projects.set(projects));
  }

  protected openCreateModal(): void {
    this.resetForm();
    this.showModal.set(true);
  }

  protected editProject(project: Project): void {
    this.selectedProjectId.set(project.id);
    this.projectForm.patchValue(project);
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  protected resetForm(): void {
    this.selectedProjectId.set(null);
    this.projectForm.reset({
      name: '',
      location: '',
      status: 'Planning',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      startDate: '',
      expectedCompletionDate: '',
      materials: '',
      budget: 0,
      notes: ''
    });
  }

  protected saveProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.projectForm.getRawValue(),
      budget: Number(this.projectForm.getRawValue().budget || 0)
    };

    const request = this.selectedProjectId()
      ? this.api.updateProject(this.selectedProjectId()!, payload)
      : this.api.createProject(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadProjects();
      this.closeModal();
    });
  }

  protected removeProject(id: string): void {
    this.api
      .deleteProject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadProjects();
        if (this.selectedProjectId() === id) {
          this.closeModal();
        }
      });
  }

  protected totalBudget(): number {
    return this.projects().reduce((total, project) => total + Number(project.budget || 0), 0);
  }

  protected ongoingCount(): number {
    return this.projects().filter((project) => project.status === 'Ongoing').length;
  }

  protected completedCount(): number {
    return this.projects().filter((project) => project.status === 'Completed').length;
  }

  protected openInvoiceModal(project: Project): void {
    this.selectedInvoiceProject.set(project);
    this.showInvoiceModal.set(true);
    this.resetInvoiceForm(project);
  }

  protected closeInvoiceModal(): void {
    this.showInvoiceModal.set(false);
    this.selectedInvoiceProject.set(null);
    this.invoiceForm.reset({
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      billToName: '',
      billToPhone: '',
      billToEmail: '',
      siteLocation: '',
      notes: ''
    });
    this.invoiceItems().clear();
  }

  protected invoiceItems(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  protected addInvoiceItem(description = '', quantity = 1, rate = 0): void {
    this.invoiceItems().push(
      this.fb.nonNullable.group({
        description: [description, Validators.required],
        quantity: [quantity, [Validators.required, Validators.min(1)]],
        rate: [rate, [Validators.required, Validators.min(0)]]
      })
    );
  }

  protected removeInvoiceItem(index: number): void {
    if (this.invoiceItems().length > 1) {
      this.invoiceItems().removeAt(index);
    }
  }

  protected invoiceTotal(): number {
    return this.invoiceItems().controls.reduce((total, control) => {
      const item = control.getRawValue() as { quantity: number; rate: number };
      return total + Number(item.quantity || 0) * Number(item.rate || 0);
    }, 0);
  }

  protected printInvoice(): void {
    if (this.invoiceForm.invalid || !this.selectedInvoiceProject()) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const project = this.selectedInvoiceProject()!;
    const invoice = this.invoiceForm.getRawValue();
    const items = this.invoiceItems().controls.map((control) => control.getRawValue() as {
      description: string;
      quantity: number;
      rate: number;
    });
    const currency = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
    const total = this.invoiceTotal();
    const rows = items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(item.description)}</td>
            <td>${item.quantity}</td>
            <td>${currency.format(item.rate)}</td>
            <td>${currency.format(item.quantity * item.rate)}</td>
          </tr>`
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=980,height=760');

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${this.escapeHtml(invoice.invoiceNumber || '')}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body { font-family: Georgia, 'Times New Roman', serif; margin: 0; color: #23323a; background: white; }
            .sheet { max-width: 900px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; gap: 24px; align-items: start; padding-bottom: 24px; border-bottom: 2px solid #d8e2dd; break-inside: avoid; page-break-inside: avoid; }
            .logo-block svg { width: 280px; height: auto; display: block; }
            .company-meta { text-align: right; font-family: 'Segoe UI', sans-serif; color: #42545c; line-height: 1.6; }
            .company-meta strong { display: block; color: #173f45; font-size: 18px; margin-bottom: 6px; }
            .title-row { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin: 28px 0 20px; break-inside: avoid; page-break-inside: avoid; }
            .title-row h1 { margin: 0; font-size: 36px; color: #173f45; }
            .eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #6b7d83; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 24px; }
            .card { padding: 18px; border-radius: 18px; background: #f7faf8; border: 1px solid #dbe6e2; break-inside: avoid; page-break-inside: avoid; }
            .card h3 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7d83; font-family: 'Segoe UI', sans-serif; }
            .card p { margin: 0; line-height: 1.7; font-family: 'Segoe UI', sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            thead { display: table-header-group; }
            tbody { display: table-row-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            th, td { padding: 14px 12px; border-bottom: 1px solid #dbe6e2; text-align: left; vertical-align: top; font-family: 'Segoe UI', sans-serif; }
            th { background: #173f45; color: white; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
            .trailing { break-inside: avoid; page-break-inside: avoid; }
            .summary { margin-top: 18px; display: flex; justify-content: end; break-inside: avoid; page-break-inside: avoid; }
            .summary-box { width: 280px; padding: 18px; border-radius: 18px; background: #eef5f2; border: 1px solid #dbe6e2; font-family: 'Segoe UI', sans-serif; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .summary-row.total { font-size: 20px; font-weight: 700; color: #173f45; margin-top: 12px; padding-top: 12px; border-top: 1px solid #c6d8d2; }
            .notes { margin-top: 24px; padding: 18px; border-radius: 18px; background: #fffaf5; border: 1px solid #eadfce; font-family: 'Segoe UI', sans-serif; break-inside: avoid; page-break-inside: avoid; }
            .notes h3 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; color: #8d6540; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #dbe6e2; font-family: 'Segoe UI', sans-serif; color: #5c6a6f; font-size: 13px; break-inside: avoid; page-break-inside: avoid; }
            @media print {
              html, body { width: 210mm; min-height: 297mm; }
              .sheet { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="logo-block">
                <svg viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg" aria-label="Arcs and Spaces Interiors logo">
                  <rect width="720" height="180" rx="28" fill="#0f5a60"></rect>
                  <text x="60" y="94" fill="#d2ef86" font-size="82" font-family="Georgia, Times New Roman, serif">Arcs&amp;Spaces</text>
                  <text x="275" y="135" fill="#f4f1e8" font-size="26" letter-spacing="14" font-family="Segoe UI, sans-serif">INTERIORS</text>
                </svg>
              </div>
              <div class="company-meta">
                <strong>ArcsandSpaces interiors</strong>
                <div>Nileswar, Kottappuram Road</div>
                <div>Aanachal, 671314</div>
                <div>Mobile: 8281569250</div>
              </div>
            </div>

            <div class="title-row">
              <div>
                <div class="eyebrow">Project invoice</div>
                <h1>Invoice / Bill</h1>
              </div>
              <div class="company-meta">
                <div><strong>Invoice No</strong> ${this.escapeHtml(invoice.invoiceNumber || '')}</div>
                <div><strong>Invoice Date</strong> ${this.escapeHtml(invoice.invoiceDate || '')}</div>
                <div><strong>Due Date</strong> ${this.escapeHtml(invoice.dueDate || '')}</div>
              </div>
            </div>

            <div class="grid">
              <div class="card">
                <h3>Bill To</h3>
                <p><strong>${this.escapeHtml(invoice.billToName || '')}</strong></p>
                <p>${this.escapeHtml(invoice.billToPhone || '')}</p>
                <p>${this.escapeHtml(invoice.billToEmail || '')}</p>
              </div>
              <div class="card">
                <h3>Project Details</h3>
                <p><strong>${this.escapeHtml(project.name)}</strong></p>
                <p>${this.escapeHtml(invoice.siteLocation || project.location)}</p>
                <p>Status: ${this.escapeHtml(project.status)}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <div class="trailing">
              <div class="summary">
                <div class="summary-box">
                  <div class="summary-row"><span>Subtotal</span><strong>${currency.format(total)}</strong></div>
                  <div class="summary-row total"><span>Total</span><strong>${currency.format(total)}</strong></div>
                </div>
              </div>

              <div class="notes">
                <h3>Notes</h3>
                <div>${this.escapeHtml(invoice.notes || project.notes || 'Thank you for choosing ArcsandSpaces interiors.')}</div>
              </div>

              <div class="footer">
                This is a computer-generated invoice prepared for project billing and print-to-PDF export.
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private resetInvoiceForm(project: Project): void {
    this.invoiceItems().clear();
    this.invoiceForm.patchValue({
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate: this.todayDate(),
      dueDate: project.expectedCompletionDate || this.todayDate(),
      billToName: project.clientName,
      billToPhone: project.clientPhone,
      billToEmail: project.clientEmail,
      siteLocation: project.location,
      notes: project.notes || ''
    });
    this.addInvoiceItem('Interior design and execution services', 1, Number(project.budget || 0));
  }

  private generateInvoiceNumber(): string {
    return `ASI-${Date.now().toString().slice(-6)}`;
  }

  private todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
