/// <reference path="../typings/tsd.d.ts" />

import chai = require('chai');
import sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

import {FakeRule} from "./mock/FakeRule";
import {DefinedAndNotNan} from "../src/lib/Rules/DefinedAndNotNan";
import {ValidationRule} from "../src/lib/ValidationRule";
import {Validator} from "../src/lib/Validator";
import {RulesCollection} from "../src/lib/RulesCollection";
import {IValidationConfiguration} from "../src/lib/IValidationConfiguration";

describe('Validator', () => {
  var validator:Validator = null;

  beforeEach(() => {
    validator = new Validator();
    RulesCollection.reset();
  });

  describe('isValueValid function', () => {
    it('calls isValueValid of the given validationRule rule when calling', () => {
      var rule:FakeRule = new FakeRule();
      sinon.spy(rule, 'isValueValid');
      var validationRule:ValidationRule = new ValidationRule(rule);

      validator.validateValue(123, [validationRule]);
      expect(rule.isValueValid).to.have.been.called;
    });

    it('can create validationRules with the given rule', () => {
      var rule:FakeRule = new FakeRule();
      sinon.spy(rule, 'isValueValid');
      validator.validateValue(123, [rule]);
      expect(rule.isValueValid).to.have.been.called;
    });

    it('can create rules object by their name', () => {
      var rule:FakeRule = new FakeRule();
      var ruleStub = sinon.stub(rule, 'isValueValid').returns(false);
      RulesCollection.addRule('fakeRule', rule);

      var invalidRule = validator.isValueValid(123, ['fakeRule']);
      expect(invalidRule.rule).to.equal(rule);

      ruleStub.returns(true);
      invalidRule = validator.isValueValid(123, ['fakeRule']);
      expect(invalidRule).to.be.null;
    });

    it('always add notUndefinedOrEmpty rule', () => {
      var invalidRule = validator.isValueValid(undefined);
      expect(invalidRule.rule instanceof DefinedAndNotNan).to.be.true;
    });

    it('validates multiple rules', () => {
      var rule:FakeRule = new FakeRule();
      var rule2:FakeRule = new FakeRule();
      sinon.spy(rule, 'isValueValid');
      sinon.spy(rule2, 'isValueValid');

      validator.isValueValid(123, [rule, rule2]);
      expect(rule.isValueValid).to.have.been.called;
      expect(rule2.isValueValid).to.have.been.called;
    });

    it('gives the first rules where isValueValid failed', () => {
      var rule1:FakeRule = new FakeRule();
      var rule2:FakeRule = new FakeRule();
      var rule3:FakeRule = new FakeRule();
      var rule1Stub = sinon.stub(rule1, 'isValueValid').returns(true);
      sinon.spy(rule2, 'isValueValid');
      var rule3Stub = sinon.stub(rule3, 'isValueValid').returns(true);

      var failedRule = validator.isValueValid(123, [rule1, rule2, rule3]);
      expect(failedRule).to.be.null;

      rule1Stub.returns(false).reset();
      rule3Stub.returns(false).reset();

      failedRule = validator.isValueValid(123, [rule1, rule2, rule3]);
      expect(failedRule.rule).to.equal(rule1);
      expect(rule2.isValueValid).to.calledOnce;
    });

    it('returns true if null is given and required is not set', () => {
      var rule:FakeRule = new FakeRule();
      sinon.stub(rule, 'isValueValid', () => false);

      var failedRule = validator.isValueValid(null, [rule]);
      expect(failedRule).to.be.null;
      expect(rule.isValueValid).to.not.have.been.called;
    });
  });

  describe('isValueAsyncValid function', () => {
    it('returns a promise', () => {
      var ret:any = validator.isValueAsyncValid(null, []);
      expect(ret.then).to.not.be.undefined;
    });

    it('returns a resovled promise if called without rules', (done:any) => {
      var ret:any = validator.isValueAsyncValid(null);
      ret.then(() => {
        expect(true).to.be.true;
      },() => {
        expect(false).to.be.true;
      }).then(done.bind(null, null), done);
    });

    it('returns a resolved promise if all rules are resolved', (done:any) => {
      var rule1:FakeRule = new FakeRule(Promise.resolve());
      var rule2:FakeRule = new FakeRule(Promise.resolve());

      var ret:any = validator.isValueAsyncValid(null, [rule1, rule2]);
      ret.then(() => {
        expect(true).to.be.true;
      },() => {
        expect(false).to.be.true;
      }).then(done.bind(null, null), done);
    });

    it('returns a rejected promise with only one failing rule if a rule is rejected', (done:any) => {
      var rule1:FakeRule = new FakeRule(Promise.reject(null));
      var rule2:FakeRule = new FakeRule(Promise.reject(null));

      var ret:any = validator.isValueAsyncValid(null, [rule1, rule2]);
      ret.then(() => {
        expect(true).to.be.false;
      },(reason:ValidationRule) => {
        expect(reason).to.not.be.undefined;
        expect(reason instanceof ValidationRule).to.be.true;
      }).then(done.bind(null, null), done);
    });
  });

  describe('setPromiseLibrary', () => {
    var bluebird:any;
    beforeEach(() => {
      bluebird = require('bluebird');
    });

    it('can set another promise library', (done:any) => {
      validator.setPromiseLibrary(bluebird.Promise);
      sinon.spy(bluebird.Promise, 'all');

      var rule:FakeRule = new FakeRule(Promise.resolve(null));
      var validationRule:ValidationRule = new ValidationRule(rule);
      sinon.spy(validationRule, 'asyncIsValueValid');

      validator.isValueAsyncValid(null, [validationRule]).then(() => {
        expect(bluebird.Promise.all).to.have.been.called;
        expect(validationRule.asyncIsValueValid).to.have.been.calledWith(null, bluebird.Promise);
      }).then(done.bind(null, null), done);
    });
  });

  describe('validateValue function', () => {
    describe('synchronous validation', () => {
      it('calls validateValue', (done:any) => {
        var rule:FakeRule = new FakeRule();

        sinon.spy(validator, 'isValueValid');
        validator.validateValue(undefined, [rule]).then(() => {
          expect(validator.isValueValid).to.have.been.calledWith(undefined, ['definedAndNotNan', rule]);
        }).then(done.bind(null, null), done);
      });

      it('returns resolved promise when value satisfy every rule', (done:any) => {
        var rule:FakeRule = new FakeRule();
        var rule2:FakeRule = new FakeRule();
        var rule3:FakeRule = new FakeRule();

        validator.validateValue(123, [rule, rule2, rule3]).then(() => {
          expect(true).to.be.true;
        }, () => {
          expect(true).to.be.true;
        }).then(done.bind(null, null), done);
      });

      it('returns a rejected promise when value unsatisfy a rule', (done:any) => {
        var rule:FakeRule = new FakeRule();
        var rule2:FakeRule = new FakeRule(false);
        var rule3:FakeRule = new FakeRule();

        validator.validateValue(123, [rule, rule2, rule3]).then(() => {
          expect(true).to.be.false;
        }, () => {
          expect(true).to.be.true;
        }).then(done.bind(null, null), done);
      });
    });

    describe('async validation', () => {
      it('calls asyncValidateValue', (done:any) => {
        var rule:FakeRule = new FakeRule();
        var asyncRule:FakeRule = new FakeRule(Promise.resolve(null));

        sinon.spy(validator, 'isValueAsyncValid');
        validator.validateValue(123, [rule], [asyncRule]).then(() => {
          expect(validator.isValueAsyncValid).to.have.been.calledWith(123, [asyncRule]);
        }).then(done.bind(null, null), done);
      });

      it('returns a rejected promise if async validation was unsuccessfull', (done:any) => {
        var rule:FakeRule = new FakeRule();
        var asyncRule:FakeRule = new FakeRule(Promise.reject(null));

        validator.validateValue(123, [rule], [asyncRule]).then(() => {
          expect(true).to.be.false;
        },() => {
          expect(true).to.be.true;
        }).then(done.bind(null, null), done);
      });
    });
  });

  describe('validateObject function', () => {
    it('returns a resolved promise if no validationRules on the validated object', (done:any) => {
      var validatedObject:any = {
        value1: ''
      };
      validator.validateObject(validatedObject, <IValidationConfiguration>{}).then(() => {
        expect(true).to.be.true;
      }).then(done.bind(null, null), done);
    });

    it('relies on validateValue', (done) => {
      var validatedObject:any = {
        value1: '',
      };
      var validationConfiguration:IValidationConfiguration = {
        rules: {
          value1: [new FakeRule()]
        }
      };
      sinon.spy(validator, 'validateValue');
      validator.validateObject(validatedObject, validationConfiguration).then(() => {
        expect(validator.validateValue).to.have.been.called;
      }).then(done.bind(null, null), done);
    });

    it('calls validation once per property', (done) => {
      var validatedObject:any = {
        value1: '',
      };
      var validationConfiguration:IValidationConfiguration = {
        rules: {
          value1: [new FakeRule()]
        },
        asyncRules: {
          value1: [new FakeRule(Promise.resolve())]
        }
      };
      sinon.spy(validator, 'validateValue');
      validator.validateObject(validatedObject, validationConfiguration).then(() => {
        expect(validator.validateValue).to.have.been.calledOnce;
      }).then(done.bind(null, null), done);
    });

    it('returns a rejected promise if one of the validated object properties is not a valid value', (done:any) => {
      var rule:FakeRule = new FakeRule(false);

      var validatedObject:any = {
        value1: ''
      };
      var validationConfiguration:IValidationConfiguration = {
        rules: {
          value1: [rule]
        }
      };
      validator.validateObject(validatedObject, validationConfiguration).then(() => {
        expect(true).to.be.false;
      }, () => {
        expect(true).to.be.true;
      }).then(done.bind(null, null), done);
    });

    it('validates objects recursively', (done:any) => {
      var rule:FakeRule = new FakeRule(false);

      var validationConfiguration:IValidationConfiguration = {
        rules: {
          value3: [rule]
        }
      };

      var validatedObject:any = {
        value1: '',
        value2: {
          value3: '',
          validationConfiguration: validationConfiguration
        }
      };
      validator.validateObject(validatedObject).then(() => {
        expect(false).to.be.true;
      }, () => {
        expect(true).to.be.true;
      }).then(done.bind(null, null), done);
    });

    it('validates arrays recursively', (done) => {
      var rule:FakeRule = new FakeRule(false);

      var validationConfiguration:IValidationConfiguration = {
        rules: {
          value3: [rule]
        }
      };

      var validatedObject:any = {
        value1: '',
        value2: [{
          value3: '',
          validationConfiguration: validationConfiguration
        }]
      };
      validator.validateObject(validatedObject).then(() => {
        expect(false).to.be.true;
      }, () => {
        expect(true).to.be.true;
      }).then(done.bind(null, null), done);
    });
  });
});
