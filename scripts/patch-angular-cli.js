const fs = require('fs');
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

function patchFile(filePath, transform) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const current = fs.readFileSync(filePath, 'utf8');
  const next = transform(current);

  if (next !== current) {
    fs.writeFileSync(filePath, next);
  }
}

const factoryPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@angular',
  'cli',
  'src',
  'package-managers',
  'factory.js'
);
const packageManagerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@angular',
  'cli',
  'src',
  'package-managers',
  'package-manager.js'
);

patchFile(factoryPath, (content) => {
  if (content.includes('Skipping npm package manager verification due to local Windows shim behavior.')) {
    return content;
  }

  return content.replace(
    /        catch \{[\s\S]*?        \}/,
    `        catch {
            if (name !== 'npm') {
                if (source === 'default') {
                    initializationError = new Error(\`'\${DEFAULT_PACKAGE_MANAGER}' was selected as the default package manager, but it is not installed or cannot be found in the PATH. Please install '\${DEFAULT_PACKAGE_MANAGER}' to continue.\`);
                }
                else {
                    initializationError = new Error(\`The project is configured to use '\${name}', but it is not installed or cannot be found in the PATH. Please install '\${name}' to continue.\`);
                }
            }
            else {
                logger?.debug('Skipping npm package manager verification due to local Windows shim behavior.');
            }
        }`
  );
});

patchFile(packageManagerPath, (content) => {
  if (content.includes("this.#version = '0.0.0';")) {
    return content;
  }

  return content.replace(
    /    async getVersion\(\) \{[\s\S]*?    \}/,
    `    async getVersion() {
        if (this.#version) {
            return this.#version;
        }
        try {
            const { stdout } = await this.#run(this.descriptor.versionCommand);
            this.#version = stdout.trim();
        }
        catch (error) {
            if (this.name !== 'npm') {
                throw error;
            }
            this.#version = '0.0.0';
        }
        if (!(0, semver_1.valid)(this.#version)) {
            throw new Error(\`Invalid semver version for \${this.name}: "\${this.#version}"\`);
        }
        return this.#version;
    }`
  );
});
