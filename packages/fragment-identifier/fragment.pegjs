/**
 *  Copyright © 2016 World Wide Web Consortium, (MIT, ERCIM, Keio, Beihang).
 *  http://www.w3.org/Consortium/Legal/2015/doc-license
 */

{
    function collect() {
      var ret = {};
      var len = arguments.length;
      for (var i=0; i<len; i++) {
        for (var p in arguments[i]) {
          if (arguments[i].hasOwnProperty(p)) {
            ret[p] = arguments[i][p];
          }
        }
      }
      return ret;
    }
}


start =
    top

top
    = "state" "(" p:params ")"      { return { state: p } }
    / "selector" "(" p:params ")"   { return { selector: p } }
    / "state=" v:value              { return { state: v } }
    / "selector=" v:value           { return { selector: v } }

params
    = k1: key_value_pair k2:("," key_value_pair)*
        {
            var f = k1;
            for( var i = 0; i < k2.length; i++ ) {
                f = collect(f, k2[i][1])
            }
            return f;
        }

key_value_pair
    = "refinedBy=selector(" p:params ")"
         {
            return { refinedBy: p }
         }
    / "refinedBy=state(" p:params ")"
         {
            return { refinedBy: p }
         }
    / "startSelector=selector(" p:params ")"
        {
            return { startSelector: p };
        }
    / "endSelector=selector(" p:params ")"
        {
            return { endSelector: p };
        }
    / key:key "=" value:value
        {
            var f = {};
            var num = Number(value);
            f[key] = isNaN(num) ? decodeURIComponent(value): num;
            return f;
        }

key
    = atom

value
    = atom

atom
    = chars:validchar+ { return chars.join(""); }

validchar
    = [a-zA-Z0-9\<\>\/\[\]\:%+@.\-!\$\&\;*_]
