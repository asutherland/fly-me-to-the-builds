/**
 * The potentially brittle part where we establish semantic hierarchies that the
 * treeherder doesn't care about.  We also will do some name transformations to
 * suit our ontological commitment (hah! (inside reference)).
 *
 **/

define(function(require) {

var $model = require('./model');

var PLATFORM_MATCHER_THINGS = [
  {
    regex: /^linux(32|64)$/,
    matches: ['version'], // eh, we can use version for everyone else, so...
    name: 'Linux'
  },
  {
    regex: /^osx-(.+)$/,
    matches: ['version'],
    name: 'Mac'
  },
  {
    regex: /^windows(.+)$/,
    matches: ['version'],
    name: 'Win'
  },
  {
    regex: /^android-(.+)$/,
    matches: ['version'],
    name: 'Android'
  },
  {
    regex: /^b2g-(.+)$/,
    matches: ['version'],
    name: 'B2G',
    aliases: {
      version: {
        'device-image': 'dev-img'
      }
    }
  },
  // Okay, I'll concede the Mulet is super-important, so I'm giving it its own
  // platform family.  But...
  {
    regex: /^mulet-(.+)$/,
    matches: ['version'],
    name: 'Mullet' // ... muahahaahahahah!
  }
];


/**
 * @param opts
 * @param {String[]} opts.jobPropertyNames
 *   The job_property_names result array from a treeherder response.
 */
function Normalizer(opts) {
  /**
   * The secret decoder ring to convert the job Array representations into more
   * useful objects with key names.  Match them up pairwise with the same index.
   */
  this.jobPropertyNames = opts.jobPropertyNames;

  this.platformFamilies = [];
  this._platformFamiliesByName = {};
  /** See _getOrMakePlatform for deets. */
  this._platformCache = {};
}
Normalizer.prototype = {
  _getOrMakePlatform: function(rawPlatform) {
    // no need to parse stuff up if we already have mapped this before:
    var rawFullName = rawPlatform.name + '-' + rawPlatform.option;
    var platform = this._platformCache[rawFullName];
    if (platform) {
      return platform;
    }

    var platformInfo = null;
    // try all the matchers until one works
    for (var iMat = 0; iMat < PLATFORM_MATCHER_THINGS.length; iMat++) {
      var matcher = PLATFORM_MATCHER_THINGS[iMat];
      var match = matcher.regex.exec(rawPlatform.name);
      if (!match) {
        continue;
      }
      platformInfo = {
        name: matcher.name
      };
      // extract and transform matching groups as appropriate
      for (var iGroup = 0; iGroup < matcher.matches.length; iGroup++) {
        var propName = matcher.matches[iGroup];
        var propVal = matcher[iGroup + 1];
        if (matcher.aliases && matcher.aliases.hasOwnProperty(propName)) {
          if (matcher.aliases[propName].hasOwnProperty(propVal)) {
            propVal = matcher.aliases[propName][propVal];
          }
        }
        platformInfo[propName] = propVal;
      }
    }
    if (!platformInfo) {
      console.error('The new and terrible', rawPlatform.name,
                    rawPlatform.option, 'platform has defeated me.');
      throw new Error('The platform made me sad.  Look at the log!');
    }

    var platformFamily = this._platformFamiliesByName[platformInfo.name];
    if (!platformFamily) {
      platformFamily = new $model.PlatformFamily({
        name: platformInfo.name
      });
      this._platformFamiliesByName[platformFamily.name] = platformFamily;
    }

    // self-links into the PlatformFamily
    platform = new $model.Platform({
      family: platformFamily,
      fullName: rawFullName,
      shortName: platformInfo.version + '-' + rawPlatform.option,
      info: platformInfo
    });
    this._platformCache[rawFullName] = platform;

    return platform;
  },

  _rawJobToObj: function(rawJobArr) {
    var propNames = this.jobPropertyNames;
    var wireObj = {};
    for (var i = 0; i < propNames.length; i++) {
     wireObj[propNames[i]] = rawJobArr[i];
    }
    return wireObj;
  },

  _normalizeGroup: function(push, platform) {
  },

  _normalizePlatform: function(push, rawPlatform) {
    var platform = this._getOrMakePlatform(rawPlatform);

  },


  normalizePush: function(rawPush) {
    var i;

    var push = new $model.Push({
      id: rawPush.id
    });

    // -- job_counts: don't care!
    // -- revisions: TODO
    // -- platforms
    // platforms is an array of { groups, name, option }
    // where groups is an array of { jobs, name, symbol }
    // and jobs is the actual weird array ordered per jobPropertyNames thing.
    //
    // There is a sort-of catch-all group, "unknown".  It's where the actual
    // build goes (B) as well as either random or one-off stuff that doesn't
    // really merit its own fancy grouping.  (JP=Jetpack tests, Cpp=C++ unit
    // tests, Jit1/Jit2=Jit tests, Mn=Marionette framework, X=Xpcshell tests)
    //
    // These platforms are not how we want to slice-and-dice things.  But we
    // don't discard them entirely because we currently operate under the
    // assumption that all the tests from a given platform run using builds
    // generated from that platform.  It's pretty clear that's not 100% right,
    // but it's good enough for now.
    for (i = 0; i < rawPush.platforms.length; i++) {
      var rawPlatform = rawPush.platforms[i];
      this._normalizePlatform(push, rawPlatform);
    }

  },
};


return {
  Normalizer: Normalizer
};

}); // end define
