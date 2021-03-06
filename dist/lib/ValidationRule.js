var Rule_1 = require('./Rule');
var RulesCollection_1 = require('./RulesCollection');
var ValidationRule = (function () {
    function ValidationRule(rawRule, parameters, applyCondition) {
        this.parameters = parameters;
        this.applyCondition = applyCondition;
        if (!rawRule) {
            throw "RawRule must be an instance of Rule or a not-empty string";
        }
        this.rule = rawRule instanceof Rule_1.Rule ? rawRule : RulesCollection_1.RulesCollection.getRule(rawRule.toString());
    }
    ValidationRule.prototype.shouldBeApplied = function () {
        return this.applyCondition === undefined || this.applyCondition === null || !!ValidationRule.getValueFromFunctionOrItself(this.applyCondition);
    };
    ValidationRule.prototype.getParametersValues = function () {
        var _this = this;
        if (typeof this.parameters === 'object') {
            var parametersValues = this.parameters instanceof Array ? [] : {};
            Object.keys(this.parameters).forEach(function (parameterName) {
                parametersValues[parameterName] = ValidationRule.getValueFromFunctionOrItself(_this.parameters[parameterName]);
            });
            return parametersValues;
        }
        return ValidationRule.getValueFromFunctionOrItself(this.parameters);
    };
    ValidationRule.prototype.isValueValid = function (value) {
        return this.shouldBeApplied() ? this.rule.isValueValid(value, this.getParametersValues()) : true;
    };
    ValidationRule.prototype.asyncIsValueValid = function (value, promiseLibrary) {
        var _this = this;
        var usedPromiseLibrary = promiseLibrary ? promiseLibrary : Promise;
        if (!this.shouldBeApplied()) {
            return new usedPromiseLibrary(function (resolve) {
                resolve();
            });
        }
        var validationPromise = this.rule.isValueValid(value, this.getParametersValues());
        return validationPromise.catch(function () {
            return Promise.reject(_this);
        });
    };
    ValidationRule.getValueFromFunctionOrItself = function (rawValue) {
        if (typeof rawValue === 'function') {
            return rawValue();
        }
        return rawValue;
    };
    ValidationRule.prototype.getErrorMessage = function () {
        return this.rule.getErrorMessage(this.getParametersValues());
    };
    return ValidationRule;
})();
exports.ValidationRule = ValidationRule;
