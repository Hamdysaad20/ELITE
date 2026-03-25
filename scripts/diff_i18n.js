const en = require("./src/messages/en.json");
const ar = require("./src/messages/ar.json");
function getKeys(obj, prefix) {
  prefix = prefix || "";
  var keys = [];
  var ks = Object.keys(obj);
  for (var i = 0; i < ks.length; i++) {
    var k = ks[i];
    var path = prefix ? prefix + "." + k : k;
    if (
      typeof obj[k] === "object" &&
      obj[k] !== null &&
      !Array.isArray(obj[k])
    ) {
      keys = keys.concat(getKeys(obj[k], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}
var enKeys = getKeys(en);
var arKeys = new Set(getKeys(ar));
var missing = enKeys.filter(function (k) {
  return !arKeys.has(k);
});
console.log("EN leaf keys: " + enKeys.length);
console.log("AR leaf keys: " + arKeys.size);
console.log("Missing in ar.json: " + missing.length);
for (var j = 0; j < missing.length; j++) {
  console.log("  MISSING: " + missing[j]);
}
