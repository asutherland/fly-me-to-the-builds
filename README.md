## What? ##

It's all the build progress you love from https://tbpl.mozilla.org/ and
https://treeherder.mozilla.org/ui/#/jobs but visualized in the exciting world
of yester-morrow with rocket ships and stuff.

It's important to keep in mind that this is all quite silly and you should not
expect any realism.

## The Mapping ##

Every job is a rocket.

Most build targets are planets/moons/asteroids within a solar system consisting
of related build targets.  Some build targets may be random deep space stations
or something else that explains why they're off in the middle of nowhere.

The distance between things is based on how long the build takes.  Solar
systems are positioned based on their most common build times.  Planets are
positioned within the system to try and make their build times more realistic.

If we look at mozilla-central, builds are frequently the longest task and tests
can be ridiculously short, although some tests can also be horribly long.
Originally I was going to have solar systems for the different architectures'
and their build targets, but that doesn't work out with the distance heuristic.
If some tests only take 4 minutes, the tests need to be "in-system".

Because it's handy for there to be some relationship between targets, I've
chosen to organize systems along arch/platform lines.  Some builds have
variations that slow them down a lot, such as PGO (profile-guided
optimization), non-unified builds, address-sanitizer builds, etc.  Rather than
split these out into different systems, the plan is to just have them take
weird routes through the "PGO" nebula or close to the "PGO" blackhole or
something.

Systems (arches/platforms) ordered for tbpl consistency:
- Linux
- OS X
- Windows
- Android
- B2G

Planets (test families):
- Mochitests
- Mochitests-e10s (twin system?)
- JS
- Talos
- Reftests/crashtests

Moons are specific test targest/etc.

### Arbitrary Cutesy Stuff ###

Starred build failures are investigated disappeared ships.  If the failures are
attributed to bug 23 and bug 57, we say species 23 and species 57.  Unstarred
builds are "uninvestigated disappearances" or something like that.
