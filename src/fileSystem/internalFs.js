import ajax from '@deadlyjack/ajax';
import helpers from '../utils/helpers';
import Url from '../utils/Url';

const { resolveLocalFileSystemURL } = window;

window.resolveLocalFileSystemURL = (url, success, error) => {
  const onError = (err) => {
    if (err.code) {
      err.message = getErrorMessage(err.code);
    }
    error(err);
  };

  resolveLocalFileSystemURL(url, success, onError);
};

const fs = {
  /**
   *
   * @param {string} url
   * @returns {Promise}
   */
  listDir(url) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(url, success, reject);

      function success(fs) {
        const reader = fs.createReader();
        reader.readEntries(resolve, reject);
      }
    });
  },

  /**
   *
   * @param {string} filename
   * @param {any} data
   * @param {boolean} create If this property is true, and the requested file or
   * directory doesn't exist, the user agent should create it.
   * The default is false. The parent directory must already exist.
   * @param {boolean} exclusive If true, and the create option is also true,
   * the file must not exist prior to issuing the call.
   * Instead, it must be possible for it to be created newly at call time. The default is true.
   * @returns {Promise}
   */
  writeFile(filename, data, create = false, exclusive = true) {
    exclusive = create ? exclusive : false;
    const name = filename.split('/').pop();
    const dirname = Url.dirname(filename);

    if (data instanceof ArrayBuffer) data = new Blob([data]);

    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        dirname,
        (entry) => {
          entry.getFile(
            name,
            { create, exclusive },
            (fileEntry) => {
              fileEntry.createWriter((file) => {
                file.onwriteend = (res) => resolve(filename);
                file.onerror = (err) => reject(err.target.error);
                file.write(data);
              });
            },
            reject,
          );
        },
        reject,
      );
    });
  },

  /**
   *
   * @param {string} filename
   * @returns {Promise}
   */
  delete(filename) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        filename,
        (entry) => {
          if (entry.isFile) {
            entry.remove(resolve, reject);
          } else {
            entry.removeRecursively(resolve, reject);
          }
        },
        reject,
      );
    });
  },

  /**
   *
   * @param {string} filename
   * @param {string} encoding
   * @returns {Promise}
   */
  readFile(filename, encoding) {
    return new Promise((resolve, reject) => {
      if (!filename) return reject('Invalid valud of fileURL: ' + filename);
      window.resolveLocalFileSystemURL(
        filename,
        (fileEntry) => {
          (async () => {
            const url = fileEntry.toInternalURL();
            try {
              let data = await ajax({
                url: url,
                responseType: 'arraybuffer',
              });

              if (encoding) {
                data = helpers.decodeText(data, encoding);
              }

              resolve({ data });
            } catch (error) {
              fileEntry.file((file) => {
                const fileReader = new FileReader();
                fileReader.onloadend = function () {
                  resolve({
                    data: this.result,
                  });
                };

                fileReader.onerror = reject;

                fileReader.readAsArrayBuffer(file);
              }, reject);
            }
          })();
        }, reject);
    });
  },

  /**
   *
   * @param {string} url
   * @param {string} newname
   * @returns {Promise}
   */
  renameFile(url, newname) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        url,
        (fs) => {
          fs.getParent((parent) => {
            const parentUrl = parent.nativeURL;
            const newUrl = Url.join(parentUrl, newname);
            fs.moveTo(parent, newname, () => resolve(newUrl), reject);
          }, reject);
        },
        reject,
      );
    });
  },

  /**
   *
   * @param {string} path
   * @param {string} dirname
   * @returns {Promise}
   */
  createDir(path, dirname) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        path,
        (fs) => {
          fs.getDirectory(
            dirname,
            {
              create: true,
            },
            () => resolve(Url.join(path, dirname)),
            reject,
          );
        },
        reject,
      );
    });
  },

  copy(src, dest) {
    return moveOrCopy('copyTo', src, dest);
  },

  move(src, dest) {
    return moveOrCopy('moveTo', src, dest);
  },

  /**
   *
   * @param {"copyTO"|"moveTo"} action
   * @param {string} src
   * @param {string} dest
   */
  moveOrCopy(action, src, dest) {
    return new Promise((resolve, reject) => {
      this.verify(src, dest)
        .then((res) => {
          const { src, dest } = res;

          src[action](
            dest,
            undefined,
            (entry) => resolve(entry.nativeURL),
            reject,
          );
        })
        .catch(reject);
    });
  },

  stats(filename) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(filename, (entry) => {
        filename = entry.nativeURL;
        sdcard.stats(
          filename,
          (stats) => {
            stats.uri = filename;
            resolve(stats);
          },
          reject,
        );
      }, reject);
    });
  },

  /**
   *
   * @param {string} src
   * @param {string} dest
   * @returns {Promise<{src:Entry, dest:Entry}>}
   */
  verify(src, dest) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        src,
        (srcEntry) => {
          window.resolveLocalFileSystemURL(
            dest,
            (destEntry) => {
              window.resolveLocalFileSystemURL(
                Url.join(destEntry.nativeURL, srcEntry.name),
                (res) => {
                  reject({
                    code: 12,
                  });
                },
                (err) => {
                  if (err.code === 1) {
                    resolve({
                      src: srcEntry,
                      dest: destEntry,
                    });
                  } else {
                    reject(err);
                  }
                },
              );
            },
            reject,
          );
        },
        reject,
      );
    });
  },

  /**
   *
   * @param {Promise<Boolean>} url
   */
  exists(url) {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        url,
        (entry) => {
          resolve(true);
        },
        (err) => {
          if (err.code === 1) resolve(false);
          reject(err);
        },
      );
    });
  },
};

/**
 * Get error message for file error code
 * @param {number} code
 * @returns {string}
 */
export function getErrorMessage(code) {
  switch (code) {
    case 1:
      return 'Path not found';
    case 2:
      return 'Security error';
    case 3:
      return 'Action aborted';
    case 4:
      return 'File not readable';
    case 5:
      return 'File encoding error';
    case 6:
      return 'Modification not allowed';
    case 7:
      return 'Invalid state';
    case 8:
      return 'Syntax error';
    case 9:
      return 'Invalid modification';
    case 10:
      return 'Quota exceeded';
    case 11:
      return 'Type mismatch';
    case 12:
      return 'Path already exists';
    default:
      return 'Uncaught error';
  }
}

export default fs;
