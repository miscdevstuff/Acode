module.exports = {
  changeProvider(reset) {
    const fs = require('fs');
    const path = require('path');


    const androidManifest = path.resolve(__dirname, "../../../platforms/android/app/src/main/AndroidManifest.xml");
    const configXML = path.resolve(__dirname, "../../../config.xml");
    const repeatChar = (char, times) => {
      let res = "";
      while (--times >= 0) res += char;
      return res;
    };

    try {
      const fileData = fs.readFileSync(configXML, "utf8");
      const widgetMatch = /<widget\s+id=['"]([^'"]+)['"]/.exec(fileData);
      if (!widgetMatch) {
          throw new Error("Could not find <widget id> in config.xml");
      }
      const manifest = fs.readFileSync(androidManifest, "utf8");
      const ID = widgetMatch[1];  // always use the real id
      //const ID = reset ? "com.foxdebug" : /widget id="([0-9a-zA-Z\.\-_]*)"/.exec(fileData)[1];
      // const newFileData = manifest.replace(
//         /(android:authorities=")([0-9a-zA-Z\.\-_]*)(")/,
//         `$1${reset ? "com.foxdebug" : ID}.provider$3`
//       );
      const newFileData = manifest.replace(
        // Match the FileProvider provider’s authorities attribute only
        /(<provider[^>]*android:name="androidx\.core\.content\.FileProvider"[^>]*android:authorities=")[^"]+(")/,
        `$1${ID}.provider$2`
      );

      fs.writeFileSync(androidManifest, newFileData);

      const msg = "==== Changed provider to " + ID + ".provider ====";

      console.log("");
      console.log(repeatChar("=", msg.length));
      console.log(msg);
      console.log(repeatChar("=", msg.length));
      console.log("");

    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
};