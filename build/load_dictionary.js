var jisho_object = {};
Object.assign(jisho_object, part1);
Object.assign(jisho_object, part2);
Object.assign(jisho_object, part3);

part1 = null;
part2 = null;
part3 = null;

browser.storage.local.set(
    jisho_object
);

jisho_object = null;