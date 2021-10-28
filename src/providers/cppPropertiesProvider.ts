import { JSDOM } from 'jsdom';
import path = require('path');
import { Utils } from '../utils';

export class CppPropertiesProvider {
  #configuration;
  json;

  constructor(xml: Uint8Array) {
    const utils = new Utils();

    this.#configuration = new JSDOM(Buffer.from(xml), { contentType: 'text/xml' }).window.document.querySelector(
      'cproject \
> storageModule[moduleId="org.eclipse.cdt.core.settings"] \
> cconfiguration[id^="com.st.stm32cube.ide.mcu.gnu.managedbuild.config.exe.debug."]'
    )!;

    const ext = process.platform === 'win32' ? '.exe' : '';

    this.json = new TextEncoder().encode(
      JSON.stringify(
        {
          configurations: [
            {
              name: 'STM32',
              includePath: this.#getIncludes(),
              defines: this.#getDefinitions(),
              compilerPath: path.join(utils.gccPath(), `arm-none-eabi-g++${ext}`),
              cStandard: utils.getConfig('cStandard'),
              cppStandard: utils.getConfig('cppStandard'),
              intelliSenseMode: '${default}',
            },
          ],
          version: 4,
        },
        null,
        '  '
      )
    );
  }

  #getIncludes() {
    const res = [];
    for (const item of [
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.includepaths',
    ]) {
      for (const value of this.#configuration.querySelectorAll(`option[superClass="${item}"] > listOptionValue`)) {
        res.push(
          '${workspaceFolder}/' +
            value
              .getAttribute('value')!
              .trim()
              .replace(/^\.\.\//, '')
        );
      }
    }
    return res.filter((val, i, arr) => arr.indexOf(val) === i);
  }

  #getDefinitions() {
    const res = [];
    for (const item of [
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.definedsymbols',
    ]) {
      for (const value of this.#configuration.querySelectorAll(`option[superClass="${item}"] > listOptionValue`)) {
        res.push(value.getAttribute('value')!.trim());
      }
    }
    return res.filter((val, i, arr) => arr.indexOf(val) === i);
  }
}
