const path = require('path');
const fs = require('fs');

async function startApp() {
  function removeExportDefault(code) {
    return code.replace(/\bexport\s+default\s+/g, '');
  }

  function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  const enPath = path.join('src', 'data', 'locales', 'en.ts');
  const translatePath = path.join('src', 'data', 'locales', 'translate.ts');

  try {
    const text = await fs.readFileSync(enPath, {
      encoding: 'utf8',
    });
    const textJson = JSON.parse(removeExportDefault(text) || '{}');
    let translateJson = {};
    for (const keys of Object.keys(textJson)) {
      translateJson = {
        ...translateJson,
        [capitalize(keys)]: keys,
      };
    }
    await fs.writeFileSync(translatePath, `export const T = ${JSON.stringify(translateJson, null, 2)}`);
    console.log('Refactor completed');
  } catch (e) {
    console.log(e);
  }
}

startApp();
