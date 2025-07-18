const fs = require('fs').promises;
const path = require("path");
//const chokidar = require('chokidar');

let watcher;
let rootPath;
let messageLog;

let db = {
  createObject: async function(key, data){
    if(!db.hasOwnProperty(key)){
      db[key] = {};
    }
    db[key] = {...db[key], ...data};

    if(messageLog) messageLog(`db.createObject: ${key}`);
  
    return db.create(`${rootPath}/${key}.json`, key, db[key]);
  },

  createTable: async function(key){
    db[key] = [];

    db[key].get = (id) => {
      if(db[key].length == 0) return undefined;
      return db[key].find(o => o.id == id);
    }

    db[key].count = (filter) => {
      if(db[key].length == 0) return 0;
      return db[key].filter(filter).length;
    }

    db[key].update = async () => {
      try{
        await fs.mkdir(`${rootPath}/${key}`, {} , (err) => {
          if (err) throw err;
        });
      }catch{}
    }
    
    db[key].delete = async () => {
      try {
        await fs.access(`${rootPath}/${key}`, fs.constants.F_OK);
        await fs.rm(`${rootPath}/${key}`, { recursive: true }, (err) => {
          if (err) throw err;
        });
      } catch {}

      delete db[key];
      
      if(messageLog) messageLog(`db.deleteTable: ${key}`);
    }

    db[key].createRow = async (data, idx) => {
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

      if(messageLog) messageLog(`db.createRow: ${key}/${idx}`);

      return db.create(`${rootPath}/${key}/${idx}.json`, key, db[key][idx], idx);
    }

    if(messageLog) messageLog(`db.createTable: ${key}`);

    return db[key];
  },

  load: async function(filePath, data){
    const file = path.parse(path.relative(rootPath, filePath));
    let key = file.dir === '' ? file.name : file.dir;
    let idx = file.dir === '' ? undefined : file.name;

    if(messageLog) messageLog(`db.loadFile: ${filePath}`);

    let obj = idx === undefined ? db.createObject(key, data) : db[key].createRow(data, idx);

    return obj;
  },

  create: async function(filePath, key, obj, idx){
    obj.update = async (data) => {
      if(data === undefined) data = obj;

      // try{
      //   await watcher.unwatch(filePath);
      // }catch{}

      if(idx !== undefined){
        await db[key].update();
      }

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

    const files = await getFiles(rootPath);
    for (const file of files) {
      if(file.isDir && !db.hasOwnProperty(file.name)) await db.createTable(file.name);
      if(!file.isDir){
        const data = await fs.readFile(file.path);
        db.load(file.path, JSON.parse(data));
      }
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
    const files = await getFiles(rootPath);
    for (const file of files) {
      if(file.dir == "") await db.delete(file.path);
    }
    db.indices = {};
    try{
      await fs.rm(rootPath + "/indices.json", { }, (err) => {
        if (err) throw err;
      });
    }catch{}
  }
};

async function getFiles(path, dir = "") {
  let files = [];

  const dirents = await fs.readdir(path, { withFileTypes: true });

  for(const dirent of dirents){
    const filePath = `${path}/${dirent.name}`;
    if(dirent.name === 'indices.json') continue;
    if (dirent.isDirectory()) {
      files.push({ name: dirent.name, dir: dir, path: filePath, isDir: true });
      let filesInDir = await getFiles(filePath, dirent.name);
      files = files.concat(filesInDir);
    } else {
      files.push({ name: dirent.name, dir: dir, path: filePath, isDir: false });
    }
  };
  return files;
}

exports = module.exports = db;