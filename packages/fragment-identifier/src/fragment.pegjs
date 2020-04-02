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
            return k2.reduce((acc, cur) => Object.assign(acc, cur[1]), k1);
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
