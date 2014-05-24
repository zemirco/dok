
var should = require('should');
var dok = require('../');

describe('dok', function() {

  describe('getLevel()', function() {

    it('should return the heading level', function() {
      dok.getLevel('# Title').should.equal(1);
      dok.getLevel('## Title').should.equal(2);
      dok.getLevel('### Title').should.equal(3);
      dok.getLevel('#### Title').should.equal(4);
      dok.getLevel('##### Title').should.equal(5);
      dok.getLevel('###### Title').should.equal(6);
      dok.getLevel('# ##### Title').should.equal(1);
    });

    it('should return null when no hashes found', function() {
      (dok.getLevel('Title') === null).should.be.true;
    });

  });

  describe('index()', function() {
    var headings = ['# About', '# Installation', '## Configuration', '# License'];

    it('should return the index for a section in headings array', function() {
      var section = 'License';
      dok.index(section, headings).should.equal(3);
    });

    it('should return null when sections is not found', function() {
      (dok.index('Start', headings) === null).should.be.true;
    });

  });

});
