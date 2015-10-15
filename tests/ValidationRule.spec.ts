/// <reference path="../typings/tsd.d.ts" />

import chai = require('chai');
import sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

import {FakeRule} from "./mock/FakeRule";
import {ValidationRule} from "../src/lib/ValidationRule";
import {RulesCollection} from "../src/lib/RulesCollection";

describe("ValidationRule", () => {
  describe("constructor", () => {
    it("throw an exception if a falsy value is given", () => {
      [null, undefined, ''].forEach((falsyValue) => {
        try {
          var validationRule:ValidationRule = new ValidationRule(falsyValue);
          expect(undefined).to.not.be.undefined;
        }
        catch(e) {
          expect(undefined).to.be.undefined;
        }
      });
    });
    it("set its rule to the given Rule if instance of IRule", () => {
      var rule:FakeRule = new FakeRule();
      var validationRule:ValidationRule = new ValidationRule(rule);

      expect(validationRule.rule).to.equal(rule);
    });
    it("set its rule to the one found in the rule collection if a string is given", () => {
      var validationRule:ValidationRule = new ValidationRule('required');

      expect(validationRule.rule).to.equal(RulesCollection.getRule('required'));
    });
  });

  describe("getParametersValues function", () => {
    it("gives undefined if no parameters", () => {
      var rule:FakeRule = {isValueValid:() => true};
      var validationRule:ValidationRule = new ValidationRule(rule);
      var parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.be.undefined;
    });
    it("returns the values of the parameters", () => {
      var rule:FakeRule = {isValueValid:() => true};
      var validationRule:ValidationRule = new ValidationRule(rule, 1);
      var parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.equal(1);

      validationRule.parameters = [1, 2];
      parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.eql([1,2]);

      validationRule.parameters = {a: 'b'};
      parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.eql({a: 'b'});
    });
    it('accepts function as parameters', () => {
      var rule:FakeRule = {isValueValid:() => true};

      var validationRule:ValidationRule = new ValidationRule(rule, () => 'foo');
      var parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.equal('foo');

      validationRule.parameters = {foo: () => 'bar'};
      parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.eql({foo: 'bar'});

      validationRule.parameters = [() => 'bar'];
      parametersValues = validationRule.getParametersValues();
      expect(parametersValues).to.eql(['bar']);
    });
  });

  describe("shouldBeApplied function", () => {
    it("returns true if no applyCondition is set", () => {
      var rule:FakeRule = new FakeRule();
      var validationRule:ValidationRule = new ValidationRule(rule);

      var shouldBeApplied:boolean = validationRule.shouldBeApplied();
      expect(shouldBeApplied).to.be.true;

      validationRule.applyCondition = null;
      shouldBeApplied = validationRule.shouldBeApplied();
      expect(shouldBeApplied).to.be.true;
    });

    it('returns the boolean value of applyCondition', () => {
      var rule:FakeRule = new FakeRule();
      var validationRule:ValidationRule = new ValidationRule(rule);

      [true, 1, 'aze', () => true].forEach((truthyValue:any) => {
        validationRule.applyCondition = truthyValue;
        var shouldBeApplied:boolean = validationRule.shouldBeApplied();
        expect(shouldBeApplied).to.be.true;
      });

      [false, 0, '', () => false].forEach((falsyValue:any) => {
        validationRule.applyCondition = falsyValue;
        var shouldBeApplied:boolean = validationRule.shouldBeApplied();
        expect(shouldBeApplied).to.be.false;
      });
    });
  });

  describe("isValueValid function", () => {
    it("calls isValueValid", () => {
      var rule:FakeRule = new FakeRule();
      sinon.spy(rule, 'isValueValid');
      var validationRule:ValidationRule = new ValidationRule(rule);

      validationRule.isValueValid(null);
      expect(rule.isValueValid).to.have.been.called;
    });

    it("calls isValueValid of rule with computed parameters", () => {
      var rule:FakeRule = new FakeRule();
      sinon.spy(rule, 'isValueValid');
      var validationRule:ValidationRule = new ValidationRule(rule, [1, 2, () => 'bar']);
      sinon.spy(validationRule, 'getParametersValues');

      validationRule.isValueValid(null);
      expect(validationRule.getParametersValues).to.have.been.called;
      expect(rule.isValueValid).to.have.been.calledWith(null, [1, 2, 'bar']);
    });

    it("does not call isValueValid of rule if shoudlBeApplied returns false", () => {
      var rule:FakeRule = new FakeRule();
      sinon.spy(rule, 'isValueValid');
      var validationRule:ValidationRule = new ValidationRule(rule, [], false);
      sinon.spy(validationRule, 'shouldBeApplied');

      validationRule.isValueValid(null);
      expect(validationRule.shouldBeApplied).to.have.been.called;
      expect(rule.isValueValid).to.not.have.been.called
    });
  });
});