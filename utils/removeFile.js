import fs from 'fs';

export const removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
      if (err) throw (err);
  });
}
