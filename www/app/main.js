/**
 *
 **/

define(function(require) {

var $gimme = require('./treestuff/gimme');
var $arranger = require('./universe/arranger');

function main() {
  var useRepo = 'mozilla-inbound';
  var usePushes = [
    '23ee92252bf7', // dbaron clean push (chronologically after the next ones)
    /*
    '0529fb43bd5f', // wmccloskey busted push
    '92de4e82f011', // philor backout of busted push
    'b4735c318a46', // arpad.borsos' clean push
     */
  ];

  var repoGrabber = new $gimme.RepoGrabber({ repoName: useRepo });
  repoGrabber.grabPushes(usePushes).then(function(pushes) {
    console.log('pushes:', pushes);
    console.log('normalizer:', repoGrabber.normalizer);

    var platformFamilies = repoGrabber.normalizer.platformFamilies;
    var arranger = new $arranger.UniverseArranger({
      platformFamilies: platformFamilies,
    });
    console.log('arranger', arranger);
    arranger.arrange();
    arranger.systems.forEach(function(system) {
      console.log('system', system.name, system);
      system.kids.forEach(function(planet) {
        console.log('  planet', planet.name, 'x:', planet.x, 'y:', planet.y,
                    planet);
        planet.kids.forEach(function(moon) {
          console.log('  moon:', moon.name, 'x:', moon.x, 'y:', moon.y, moon);
        });
      });
    });
  }.bind(this));
};

main();

}); // end define
