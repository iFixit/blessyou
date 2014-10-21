
module.exports = function (overrides) {
   overrides = overrides || {};
   var options = {
      depends: false,
      compress: false,
      cleancss: false,
      max_line_len: -1,
      optimization: 1,
      silent: false,
      verbose: false,
      lint: false,
      paths: [],
      color: false,
      strictImports: false,
      insecure: false,
      rootpath: '',
      relativeUrls: false,
      ieCompat: true,
      strictMath: false,
      strictUnits: false,
      urlArgs: null
   };

   Object.keys(options).forEach(function(key) {
      if (overrides.hasOwnProperty(key)) {
         options[key] = overrides[key];
      }
   });

   return options;
};
