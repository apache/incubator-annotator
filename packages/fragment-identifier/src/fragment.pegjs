{
    function debug(input, range) {
      // Prints the location of the parser.
      // Use e.g. in an action: { debug(input, range); return text(); }
      const [start, end] = range();
      const underline = (end > start + 1)
        ? ' '.repeat(start) + '\\' + '_'.repeat(end - start - 2) + '/'
        : ' '.repeat(start) + '^';
      console.log(input);
      console.log(underline);
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

// FIXME
// While an opening parenthesis is always valid, a closing parenthesis
// *might* be part of the value, but could also be the delimiter that
// closes a selector(…) or state(…). The attempt below uses a look-ahead
// to not match ')' before a comma or before another ')', or at the end
// of the input. However, it will fail if a last param’s value ends with
// ')', or if a key or value contains '))'. For example:
//   selector(type=TextQuoteSelector,exact=example%20(that%20fails))
//   selector(type=TextQuoteSelector,exact=another))failure)
validchar
    = [a-zA-Z0-9\<\>\/\[\]\:%+@.\-!\$\&\;*_\(]
    / $( ")" &[^,)] )
