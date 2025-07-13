const fs = require('fs').promises;
const path = require("path");
const chokidar = require('chokidar');
const { enableCompileCache } = require('module');

let watcher;
let rootPath;
let messageLog;

let db = {
  createObject: async function(key, data){
    if(!db.hasOwnProperty(key)){
      db[key] = {};
    }
    db[key] = {...db[key], ...data};
  
    return db.create(`${rootPath}/${key}.json`, key, db[key]);
  },

  createRow: async function(key, data, idx){
    if(!db.hasOwnProperty(key)){
      db[key] = [];
    }
    if(idx === undefined){
      if(!db.indices.hasOwnProperty(key)){
        db.indices[key] = -1;
      }
      idx = ++db.indices[key];
      await db.updateIndices();
    }else{
      if(!db.indices.hasOwnProperty(key)){
        db.indices[key] = idx;
        await db.updateIndices();
      }else if(db.indices[key] < idx) db.indices[key] = idx;
    }
    if(db[key][idx] === undefined){
      db[key][idx] = {};
    }
    db[key][idx] = {...db[key][idx], ...data};

    return db.create(`${rootPath}/${key}/${idx}.json`, key, db[key][idx], idx);
  },

  load: async function(filePath, data){
    const file = path.parse(path.relative(rootPath, filePath));
    let key = file.dir === '' ? file.name : file.dir;
    let idx = file.dir === '' ? undefined : file.name;

    if(messageLog) messageLog(`db.load: ${filePath}`);

    let obj = idx === undefined ? db.createObject(key, data) : db.createRow(key, data, idx);

    return obj;
  },

  create: async function(filePath, key, obj, idx){
    obj.update = async (data) => {
      if(data === undefined) data = obj;

      // try{
      //   await watcher.unwatch(filePath);
      // }catch{}

      await fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
        if (err) throw err;
      });

      await fs.writeFile(filePath, JSON.stringify(data, null, 4), function (err) {
        if (err) throw err;
      });

      if(idx === undefined){
        db[key] = data;
      }
      else{
        db[key][idx] = data;
      }

      if(messageLog) messageLog(`db.update: ${filePath}`);

      //watcher.add(filePath);

      return obj;
    }

    obj.delete = async () => {
      try {
        await fs.access(filePath, fs.constants.F_OK);
        //await watcher.unwatch(filePath);
        await fs.rm(filePath, { recursive: true }, (err) => {
          if (err) throw err;
        });
      } catch {}

      if(idx === undefined){
        delete db[key];
      }
      else{
        delete db[key][idx];
      }

      if(messageLog) messageLog(`db.delete: ${filePath}`);
    }

    if(messageLog) messageLog(`db.create: ${filePath}`);

    return obj;
  },

  initIndices: async function(){
    try{
      db.indices = JSON.parse(await fs.readFile(rootPath + "/indices.json"));
    }catch{
      db.indices = {};
    }
  },
  
  updateIndices: async function(){
    await fs.writeFile(rootPath + "/indices.json", JSON.stringify(db.indices, null, 4), function (err) {
      if (err) throw err;
    });
  },

  init: async function(root, log){
    if(log){
      messageLog = log; 
      messageLog("db.init");
    }

    rootPath = root;

    db.initIndices();

    for await (const filePath of getFiles(root)) {
      const data = await fs.readFile(filePath);
      db.load(filePath, JSON.parse(data));
    }
    
    // watcher = chokidar.watch(root, { ignored: (f, stats) => f.indexOf("indices.json") !== -1})
    //   .on('change', async (file) => {
    //     const data = await fs.readFile(file);
    //     await db.load(file, JSON.parse(data));
    //   })
    //   .on('unlink', async (file) => {
    //     await db.delete(file);
    //   });

    Array.prototype.count = function() {
      let res = 0;

      this.forEach(function (item) { if(item != null) res++; });

      return res;
    };
  },

  delete: async function(filePath){
    const file = path.parse(path.relative(rootPath, filePath));
    let key = file.dir === '' ? file.name : file.dir;
    let idx = file.dir === '' ? undefined : file.name;

    if(idx !== undefined){
      await db[key][idx].delete();
    }
    else{
      await db[key].delete();
    }
  },

  deleteAll: async function(){
    for await (const filePath of getFiles(rootPath)) {
      await db.delete(filePath);
    }
    db.indices = {};
  }
};

async function* getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const filePath = `${dir}/${dirent.name}`;
    if(dirent.name === 'indices.json') continue;
    if (dirent.isDirectory()) {
      yield* getFiles(filePath);
    } else {
      yield filePath;
    }
  }
}

exports = module.exports = db;