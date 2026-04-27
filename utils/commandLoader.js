const fs = require("fs");
const path = require("path");

class CommandLoader {
  constructor(commandDir) {
    this.commandDir = commandDir;
    this.commands = new Map();
    this.aliases = new Map();
    this.fileMtimes = new Map();
  }

  loadAll() {
    const files = fs
      .readdirSync(this.commandDir)
      .filter((f) => f.endsWith(".js"));

    let loaded = 0;
    for (const file of files) {
      try {
        this._loadFile(file);
        loaded++;
      } catch (err) {
        console.error(`❌ Gagal load command ${file}:`, err.message);
      }
    }

    console.log(`✅ ${loaded}/${files.length} commands dimuat ke memory`);
    return loaded;
  }

  _loadFile(file) {
    const filePath = path.join(this.commandDir, file);
    const stat = fs.statSync(filePath);

    delete require.cache[require.resolve(filePath)];

    const cmd = require(filePath);

    if (!cmd.name) {
      throw new Error(`Command ${file} tidak punya property 'name'`);
    }

    this.commands.set(cmd.name, cmd);

    if (cmd.aliases && Array.isArray(cmd.aliases)) {
      for (const alias of cmd.aliases) {
        this.aliases.set(alias, cmd.name);
      }
    }

    this.fileMtimes.set(file, stat.mtimeMs);

    return cmd;
  }

  get(name) {
    const direct = this.commands.get(name);
    if (direct) return direct;

    const aliasTarget = this.aliases.get(name);
    if (aliasTarget) return this.commands.get(aliasTarget);

    return null;
  }

  reloadChanged() {
    const files = fs
      .readdirSync(this.commandDir)
      .filter((f) => f.endsWith(".js"));

    let reloaded = 0;

    for (const file of files) {
      try {
        const filePath = path.join(this.commandDir, file);
        const stat = fs.statSync(filePath);
        const lastMtime = this.fileMtimes.get(file);

        if (!lastMtime || stat.mtimeMs > lastMtime) {
          const oldCmd = this._findCommandByFile(file);
          if (oldCmd?.aliases) {
            for (const alias of oldCmd.aliases) {
              this.aliases.delete(alias);
            }
          }

          this._loadFile(file);
          reloaded++;
        }
      } catch (err) {
        console.error(`❌ Gagal reload ${file}:`, err.message);
      }
    }

    return reloaded;
  }


  _findCommandByFile(file) {
    const filePath = path.join(this.commandDir, file);
    for (const [, cmd] of this.commands) {
      const resolved = require.resolve(filePath);
      if (require.cache[resolved] && require.cache[resolved].exports === cmd) {
        return cmd;
      }
    }
    return null;
  }


  getAll() {
    return this.commands;
  }


  get size() {
    return this.commands.size;
  }
}

module.exports = { CommandLoader };
