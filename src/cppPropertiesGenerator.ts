import { JSDOM } from 'jsdom';

export class CppPropertiesGenerator {
  #configuration: Element;

  constructor(xml: Buffer) {
    this.#configuration = new JSDOM(xml, { contentType: 'text/xml' }).window.document.querySelector(
      'cproject \
> storageModule[moduleId="org.eclipse.cdt.core.settings"] \
> cconfiguration[id^="com.st.stm32cube.ide.mcu.gnu.managedbuild.config.exe.debug."]'
    )!;
  }

  getJson() {
    return new TextEncoder().encode(
      JSON.stringify(
        {
          configurations: [
            {
              name: 'STM32',
              includePath: this.#getIncludes(),
              defines: this.#getDefinitions(),
              cStandard: 'gnu11',
              cppStandard: 'gnu++14',
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
