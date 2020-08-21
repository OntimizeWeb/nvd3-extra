// Package metadata for Meteor.js full stack web framework
// This file is defined in Meteor documentation at http://docs.meteor.com/#/full/packagejs
// and used by Meteor https://www.meteor.com/ and its package repository Atmosphere https://atmospherejs.com

Package.describe({
  "name": 'nvd3-extra:nvd3-extra',
  summary: 'Nvd3.org extra charts.',
  version: '1.0.0',
  git: "https://github.com/novus/nvd3.git"
});
Package.on_use(function (api) {
  api.versionsFrom("METEOR@1.0");
  api.use('d3js:d3@3.5.17', 'client');
  api.use('nvd3js:nvd3@1.8.6', 'client');
  api.add_files('build/nv.d3.extra.js', 'client');
  api.add_files('build/nv.d3.extra.css', 'client');
  // api.add_files('meteor/export.js', 'client');
  // api.export("nv");
});
// Package.onTest(function (api) {
//   api.use(['tinytest', 'test-helpers']);
//   api.use('d3js:d3', 'client');
//   api.use('nvd3js:nvd3@1.8.6', 'client');
//   api.addFiles(['build/nv.d3.extra.js', 'meteor/export.js'], "client");
//   api.addFiles('test/tinytest/nv-is-defined-test.js', "client");
// });
