'use strict';

describe('SCE', function() {

  describe('when disabled', function() {
    beforeEach(function() {
      module(function($sceProvider) {
        $sceProvider.enabled(false);
      });
    });

    it('should provide the getter for enabled', inject(function($sce) {
      expect($sce.isEnabled()).toBe(false);
    }));

    it('should not wrap/unwrap any value or throw exception on non-string values', inject(function($sce) {
      var originalValue = { foo: "bar" };
      expect($sce.trustAs($sce.JS, originalValue)).toBe(originalValue);
      expect($sce.getTrusted($sce.JS, originalValue)).toBe(originalValue);
    }));
  });

  describe('IE8 quirks mode', function() {
    function runTest(enabled, documentMode, expectException) {
      module(function($provide) {
        $provide.value('$document', [{
          documentMode: documentMode,
          createElement: function() {}
        }]);
        $provide.value('$sceDelegate', {trustAs: null, valueOf: null, getTrusted: null});
      });

      inject(function($window, $injector) {
        function constructSce() {
          var sceProvider = new $SceProvider();
          sceProvider.enabled(enabled);
          return $injector.invoke(sceProvider.$get, sceProvider);
        }

        var origMsie = $window.msie;
        try {
          $window.msie = true;
          if (expectException) {
            expect(constructSce).toThrow(
                '[$sce:iequirks] Strict Contextual Escaping does not support Internet Explorer ' +
                'version < 9 in quirks mode.  You can fix this by adding the text <!doctype html> to ' +
                'the top of your HTML document.  See http://docs.angularjs.org/api/ng.$sce for more ' +
                'information.');
          } else {
            // no exception.
            constructSce();
          }
        }
        finally {
          $window.msie = origMsie;
        }
      });
    }

    it('should throw an exception when sce is enabled in quirks mode', function() {
      runTest(true, 7, true);
    });

    it('should NOT throw an exception when sce is enabled and in standards mode', function() {
      runTest(true, 8, false);
    });

    it('should NOT throw an exception when sce is enabled and documentMode is undefined', function() {
      runTest(true, undefined, false);
    });

    it('should NOT throw an exception when sce is disabled even when in quirks mode', function() {
      runTest(false, 7, false);
    });

    it('should NOT throw an exception when sce is disabled and in standards mode', function() {
      runTest(false, 8, false);
    });

    it('should NOT throw an exception when sce is disabled and documentMode is undefined', function() {
      runTest(false, undefined, false);
    });
  });

  describe('when enabled', function() {
    it('should wrap string values with TrustedValueHolder', inject(function($sce) {
      var originalValue = 'original_value';
      var wrappedValue = $sce.trustAs($sce.HTML, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.HTML, wrappedValue)).toBe('original_value');
      expect(function() { $sce.getTrusted($sce.CSS, wrappedValue); }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
      wrappedValue = $sce.trustAs($sce.CSS, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.CSS, wrappedValue)).toBe('original_value');
      expect(function() { $sce.getTrusted($sce.HTML, wrappedValue); }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
      wrappedValue = $sce.trustAs($sce.URL, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.URL, wrappedValue)).toBe('original_value');
      wrappedValue = $sce.trustAs($sce.JS, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.JS, wrappedValue)).toBe('original_value');
    }));

    it('should NOT wrap non-string values', inject(function($sce) {
      expect(function() { $sce.trustAsCss(123); }).toThrow(
          '[$sce:itype] Attempted to trust a non-string value in a content requiring a string: ' +
          'Context: css');
    }));

    it('should NOT wrap unknown contexts', inject(function($sce) {
      expect(function() { $sce.trustAs('unknown1' , '123'); }).toThrow(
          '[$sce:icontext] Attempted to trust a value in invalid context. Context: unknown1; Value: 123');
    }));

    it('should NOT wrap undefined context', inject(function($sce) {
      expect(function() { $sce.trustAs(undefined, '123'); }).toThrow(
          '[$sce:icontext] Attempted to trust a value in invalid context. Context: undefined; Value: 123');
    }));

    it('should wrap undefined into undefined', inject(function($sce) {
      expect($sce.trustAsHtml(undefined)).toBe(undefined);
    }));

    it('should unwrap undefined into undefined', inject(function($sce) {
      expect($sce.getTrusted($sce.HTML, undefined)).toBe(undefined);
    }));

    it('should wrap null into null', inject(function($sce) {
      expect($sce.trustAsHtml(null)).toBe(null);
    }));

    it('should unwrap null into null', inject(function($sce) {
      expect($sce.getTrusted($sce.HTML, null)).toBe(null);
    }));

    it('should wrap "" into ""', inject(function($sce) {
      expect($sce.trustAsHtml("")).toBe("");
    }));

    it('should unwrap null into null', inject(function($sce) {
      expect($sce.getTrusted($sce.HTML, null)).toBe(null);
    }));

    it('should unwrap "" into ""', inject(function($sce) {
      expect($sce.getTrusted($sce.HTML, "")).toBe("");
    }));

    it('should unwrap values and return the original', inject(function($sce) {
      var originalValue = "originalValue";
      var wrappedValue = $sce.trustAs($sce.HTML, originalValue);
      expect($sce.getTrusted($sce.HTML, wrappedValue)).toBe(originalValue);
    }));

    it('should NOT unwrap values when the type is different', inject(function($sce) {
      var originalValue = "originalValue";
      var wrappedValue = $sce.trustAs($sce.HTML, originalValue);
      expect(function () { $sce.getTrusted($sce.CSS, wrappedValue); }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
    }));

    it('should NOT unwrap values that had not been wrapped', inject(function($sce) {
      function TrustedValueHolder(trustedValue) {
        this.$unwrapTrustedValue = function() {
          return trustedValue;
        };
      }
      var wrappedValue = new TrustedValueHolder("originalValue");
      expect(function() { return $sce.getTrusted($sce.HTML, wrappedValue) }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
    }));

    it('should implement toString on trusted values', inject(function($sce) {
      var originalValue = '123',
          wrappedValue = $sce.trustAsHtml(originalValue);
      expect($sce.getTrustedHtml(wrappedValue)).toBe(originalValue);
      expect(wrappedValue.toString()).toBe(originalValue.toString());
    }));
  });


  describe('replace $sceDelegate', function() {
    it('should override the default $sce.trustAs/valueOf/etc.', function() {
      module(function($provide) {
        $provide.value('$sceDelegate', {
            trustAs: function(type, value) { return "wrapped:"   + value; },
            getTrusted: function(type, value) { return "unwrapped:" + value; },
            valueOf: function(value) { return "valueOf:" + value; }
        });
      });

      inject(function($sce) {
        expect($sce.trustAsJs("value")).toBe("wrapped:value");
        expect($sce.valueOf("value")).toBe("valueOf:value");
        expect($sce.getTrustedJs("value")).toBe("unwrapped:value");
        expect($sce.parseAsJs("name")({name: "chirayu"})).toBe("unwrapped:chirayu");
      });
    });
  });


  describe('$sce.parseAs', function($sce) {
   it('should parse constant literals as trusted', inject(function($sce) {
      expect($sce.parseAsJs('1')()).toBe(1);
      expect($sce.parseAsJs('1', $sce.ANY)()).toBe(1);
      expect($sce.parseAsJs('1', $sce.HTML)()).toBe(1);
      expect($sce.parseAsJs('1', 'UNDEFINED')()).toBe(1);
      expect($sce.parseAsJs('true')()).toBe(true);
      expect($sce.parseAsJs('false')()).toBe(false);
      expect($sce.parseAsJs('null')()).toBe(null);
      expect($sce.parseAsJs('undefined')()).toBe(undefined);
      expect($sce.parseAsJs('"string"')()).toBe("string");
    }));

    it('should NOT parse constant non-literals', inject(function($sce) {
      // Until there's a real world use case for this, we're disallowing
      // constant non-literals.  See $SceParseProvider.
      var exprFn = $sce.parseAsJs('1+1');
      expect(exprFn).toThrow();
    }));

    it('should NOT return untrusted values from expression function', inject(function($sce) {
      var exprFn = $sce.parseAs($sce.HTML, 'foo');
      expect(function() {
        return exprFn({}, {'foo': true})
      }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
    }));

    it('should NOT return trusted values of the wrong type from expression function', inject(function($sce) {
      var exprFn = $sce.parseAs($sce.HTML, 'foo');
      expect(function() {
        return exprFn({}, {'foo': $sce.trustAs($sce.JS, '123')})
      }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
    }));

    it('should return trusted values from expression function', inject(function($sce) {
      var exprFn = $sce.parseAs($sce.HTML, 'foo');
      expect(exprFn({}, {'foo': $sce.trustAs($sce.HTML, 'trustedValue')})).toBe('trustedValue');
    }));

    it('should support shorthand methods', inject(function($sce) {
      // Test shorthand parse methods.
      expect($sce.parseAsHtml('1')()).toBe(1);
      // Test short trustAs methods.
      expect($sce.trustAsAny).toBeUndefined();
      expect(function() {
        // mismatched types.
        $sce.parseAsCss('foo')({}, {'foo': $sce.trustAsHtml('1')});
      }).toThrow(
          '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
    }));

  });

  describe('$sceDelegate resource url policies', function() {
    function runTest(cfg, testFn) {
      return function() {
        module(function($sceDelegateProvider) {
          if (cfg.whiteList !== undefined) {
            $sceDelegateProvider.resourceUrlWhitelist(cfg.whiteList);
          }
          if (cfg.blackList !== undefined) {
            $sceDelegateProvider.resourceUrlBlacklist(cfg.blackList);
          }
        });
        inject(testFn);
      }
    }

    it('should default to "self" which allows relative urls', runTest({}, function($sce, $document) {
        expect($sce.getTrustedResourceUrl('foo/bar')).toEqual('foo/bar');
    }));

    it('should reject everything when whitelist is empty', runTest(
      {
        whiteList: [],
        blackList: []
      }, function($sce) {
        expect(function() { $sce.getTrustedResourceUrl('#'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: #');
    }));

    it('should match against normalized urls', runTest(
      {
        whiteList: [/^foo$/],
        blackList: []
      }, function($sce) {
        expect(function() { $sce.getTrustedResourceUrl('foo'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: foo');
    }));

    it('should support custom regex', runTest(
      {
        whiteList: [/^http:\/\/example\.com.*/],
        blackList: []
      }, function($sce) {
        expect($sce.getTrustedResourceUrl('http://example.com/foo')).toEqual('http://example.com/foo');
        expect(function() { $sce.getTrustedResourceUrl('https://example.com/foo'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: https://example.com/foo');
    }));

    it('should support the special string "self" in whitelist', runTest(
      {
        whiteList: ['self'],
        blackList: []
      }, function($sce) {
        expect($sce.getTrustedResourceUrl('foo')).toEqual('foo');
    }));

    it('should support the special string "self" in blacklist', runTest(
      {
        whiteList: [/.*/],
        blackList: ['self']
      }, function($sce) {
        expect(function() { $sce.getTrustedResourceUrl('foo'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: foo');
    }));

    it('should have blacklist override the whitelist', runTest(
      {
        whiteList: ['self'],
        blackList: ['self']
      }, function($sce) {
        expect(function() { $sce.getTrustedResourceUrl('foo'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: foo');
    }));

    it('should support multiple items in both lists', runTest(
      {
        whiteList: [/^http:\/\/example.com\/1$/, /^http:\/\/example.com\/2$/, /^http:\/\/example.com\/3$/, 'self'],
        blackList: [/^http:\/\/example.com\/3$/, /open_redirect/],
      }, function($sce) {
        expect($sce.getTrustedResourceUrl('same_domain')).toEqual('same_domain');
        expect($sce.getTrustedResourceUrl('http://example.com/1')).toEqual('http://example.com/1');
        expect($sce.getTrustedResourceUrl('http://example.com/2')).toEqual('http://example.com/2');
        expect(function() { $sce.getTrustedResourceUrl('http://example.com/3'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/3');
        expect(function() { $sce.getTrustedResourceUrl('open_redirect'); }).toThrow(
          '[$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  URL: open_redirect');
    }));
  });

  describe('sanitizing html', function() {
    describe('when $sanitize is NOT available', function() {
      it('should throw an exception for getTrusted(string) values', inject(function($sce) {
        expect(function() { $sce.getTrustedHtml('<b></b>'); }).toThrow(
            '[$sce:unsafe] Attempting to use an unsafe value in a safe context.');
      }));
    });

    describe('when $sanitize is available', function() {
      beforeEach(function() { module('ngSanitize'); });
      it('should sanitize html using $sanitize', inject(function($sce) {
        expect($sce.getTrustedHtml('a<xxx><B>b</B></xxx>c')).toBe('a<b>b</b>c');
      }));
    });
  });
});

