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

var GENERIC_BUCKET = 'Bucket';

/**
 * All jobs have symbols.  Those jobs may also be nested under a group that
 * usefully identifies them.  Despite this provided hierarchy, symbols are
 * currently unique AFAIK.  Some symbols really should be part of a group but
 * are not.  For example, Gaia stuff lives under the '?' group symbol.
 *
 * NOTE!  We check this literally, then we also use a regex to strip any
 * numbers off the end and then we check again without the numbers.  This is
 * because jobs frequently get split up to reduce latency, etc.  Especially
 * on super slow platforms like the b2g emulator builds.
 *
 * I'm also making some editorial decisions here since many of the current
 * groups are simply artifacts of the testing mechanism in use.
 */
var JOB_SYMBOL_TO_JOB_TYPE_FAMILY_OVERRIDES = {
  // Builds
  'B': 'Build',
  'Bd': 'Build', // debug
  'Bo': 'Build', // opt
  'Bn': 'Build', // non-unified
  'Be': 'Build', // engineering build
  'V': 'Build', // Valgrind

  // Generic Gecko test stuff
  'Cpp': GENERIC_BUCKET, // C++ unit tests
  'JP': GENERIC_BUCKET, // Jetpack/Add-on SDK
  'Mn': GENERIC_BUCKET, // Marionette
  'Mnw': GENERIC_BUCKET, // Marionette web api
  'X': GENERIC_BUCKET, // xpcshell tests
  'Set': GENERIC_BUCKET, // Happens on Android 4.2 x86opt. no clue.

  // JS engine
  'J': 'JS',
  'Jit': 'JS', // prefix variants are handled below

  // Layout / Graphics
  'R': 'Layout', // reftest stuff
  'Ripc': 'Layout',
  'Rs': 'Layout',
  'Ru': 'Layout',
  'R-oop': 'Layout',

  // Gaia stuff
  'Li': 'Gaia',
  'G': 'Gaia', // Gaia unit tests
  'Gb': 'Gaia', // Gaia build infra tests
  'Gi': 'Gaia', // Gaia JS integration tests
  'Gu': 'Gaia', // Gaia Python integration tests,

  // - Mochitest clobberin'
  // Browser chrome tests
  'bc': 'Chrome',

  // Devtools
  'dt': 'Devtools',

  // Weird mochitest weirdness
  'M-oop': 'Mochitest',
};

var GROUP_NAME_OVERRIDES = {
  'Mochitest e10s': 'e10s',
  // let's avoid random stupid group names
  'Unknown': GENERIC_BUCKET,
  'unknown': GENERIC_BUCKET
};

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
      this.platformFamilies.push(platformFamily);
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

  _getOrMakeJobTypeFamily: function(platform, name) {
    var platformFamily = platform.family;
    var jobTypeFamily = platformFamily._jobTypeFamiliesByName[name];
    if (jobTypeFamily) {
      return jobTypeFamily;
    }
    jobTypeFamily = platformFamily._jobTypeFamiliesByName[name] =
      new $model.JobTypeFamily({
        name: name
      });
    platformFamily.jobTypeFamilies.push(jobTypeFamily);
    return jobTypeFamily;
  },

  _getOrMakeJobType: function(platform, wireJob) {
    var jobTypeSymbol = wireJob.job_type_symbol;
    var jtMatch = /^(\D+)-?(\d+)$/.exec(jobTypeSymbol);
    var jobTypeSymbolRoot = jtMatch ? jtMatch[1] : jobTypeSymbol;
    var jobTypeFamilyName =
          JOB_SYMBOL_TO_JOB_TYPE_FAMILY_OVERRIDES[jobTypeSymbolRoot] ||
          GROUP_NAME_OVERRIDES[wireJob.job_group_name] ||
          wireJob.job_group_name;

    var jobTypeFamily = this._getOrMakeJobTypeFamily(platform,
                                                     jobTypeFamilyName);

    var jobTypeName = jtMatch ? jtMatch[2] : jobTypeSymbol;

    var jobType = jobTypeFamily._jobTypesByName[jobTypeName];
    if (!jobType) {
      jobType = jobTypeFamily._jobTypesByName[jobTypeName] =
        new $model.JobType({
          family: jobTypeFamily,
          name: jobTypeName,
          runningETA: wireJob.running_eta
        });
      jobTypeFamily.jobTypes.push(jobType);
    }
    return jobType;
  },

  _rawJobToObj: function(rawJobArr) {
    var propNames = this.jobPropertyNames;
    var wireObj = {};
    for (var i = 0; i < propNames.length; i++) {
      wireObj[propNames[i]] = rawJobArr[i];
    }
    return wireObj;
  },

  _normalizeJob: function(push, platform, groupName, rawJob) {
    var wireJob = this._rawJobToObj(rawJob);
    //console.log('jg', groupName, wireJob);
    var job = push.jobsById[wireJob.id];
    if (!job) {
      var jobType = this._getOrMakeJobType(platform, wireJob);

      job = push.jobsById[wireJob.id] = new $model.Job({
        jobType: jobType,
        push: push,
        wireObj: wireJob
      });
      push.jobs.push(job);
    }
    else {
      job.update(wireJob);
    }
    return job;
  },

  /**
   * Groups are almost entirely boring from our perspective; the only useful
   * bit of info they provide is the indication that we're dealing with a
   * mochitest.  So we just call into _normalizeJob and give it the family as
   * a hint if it doesn't have overrides.
   */
  _normalizeGroup: function(push, platform, rawGroup) {
    for (var i = 0; i < rawGroup.jobs.length; i++) {
      var rawJob = rawGroup.jobs[i];
      this._normalizeJob(push, platform, rawGroup.name, rawJob);
    }
  },

  _normalizePlatform: function(push, rawPlatform) {
    var platform = this._getOrMakePlatform(rawPlatform);

    for (var i = 0; i < rawPlatform.groups.length; i++) {
      var rawGroup = rawPlatform.groups[i];
      this._normalizeGroup(push, platform, rawGroup);
    }
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

    return push;
  },
};


return {
  Normalizer: Normalizer
};

}); // end define
