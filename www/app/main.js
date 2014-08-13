/**
 *
 **/

define(function(require) {

var $gimme = require('./treestuff/gimme');

function main() {
  var useRepo = 'mozilla-inbound';
  var usePushes = ['826764ae5063', 'dcffdf59b824', 'a208696de65f',
                   '48e333722371'];

  var repoGrabber = new $gimme.RepoGrabber({ repoName: useRepo });
  repoGrabber.grabPushes(usePushes).then(function(pushes) {
    console.log('pushes:', pushes);
  });
};

main();

}); // end define
