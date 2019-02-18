window.Tracks = window.tracks = (function() {
  /*
  Tracks.js
  Observes and animates DOM elements by using the MutationObserver API and
  by temporarily injecting inline styles

  MIT Style License
  Copyright (c) 2019 Nicolás Delfino <nicolas.delfino@gmail.com>
  */

  /*
  elementList - used for reversing animations
  observerList - tracks observed elements
  */
  var elementList = [];
  var observerList = [];

  /* Options for the observer (which mutations to observe) */
  var observerConfig = { attributes: false, childList: true, subtree: true };

  /*
  Valid base keys, transform keys and their handlers
  */
  var baseKeys = {
    display: null,
    visibility: null,
    opacity: null,
    delay: null,
    margin: null,
    padding: null,
    background: null,
    color: null,
    border: null,
    height: null,
    width: null,
    maxHeight: null,
    maxWidth: null,
    overflow: null,
    'font-size': null,
    'border-radius': null,
    'background-color': null,
    'border-width': null,
    'border-color': null,
    'pointer-events': null
  };

  var keyMap = Object.assign(baseKeys, {
    x: function(value) {
      return getEaseValue('translateX', value, 'px');
    },
    y: function(value) {
      return getEaseValue('translateY', value, 'px');
    },
    skewX: function(value) {
      return getEaseValue('skewX', value);
    },
    skewY: function(value) {
      return getEaseValue('skewY', value);
    },
    scaleX: function(value) {
      return getEaseValue('scaleX', value);
    },
    scaleY: function(value) {
      return getEaseValue('scaleY', value);
    },
    rotation: function(value) {
      return getEaseValue('rotate', value, 'deg');
    },
    scale: function(value) {
      return getEaseValue('scale', value);
    }
  });

  function getEaseValue(prop, value, suffix) {
    suffix = suffix || '';
    return prop + '(' + value + suffix + ')';
  }

  /* PX values */
  var pxKeys = ['width', 'height', 'margin', 'padding'];

  /*
  Easing equations
  */
  var easeEquationMap = {
    easeInSine: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
    easeOutSine: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
    easeInOutSine: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeInQuart: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
    easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
    easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
    easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
    easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
    easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
    easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
    easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
    easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  };

  /*
  Transform agents
  */
  var transformAgents = [
    'webkitTransform',
    'MozTransform',
    'msTransform',
    'OTransform',
    'transform'
  ];

  /*
  Transition agents
  */
  var transitionAgents = [
    '-webkit-transition',
    '-moz-transition',
    '-o-transition',
    'transition'
  ];

  /*
  Types
  */
  var typeDefs = {
    UNDEFINED: 'undefined',
    STRING: 'string',
    NUMBER: 'number',
    OBJECT: 'object',
    DELAY: 'delay',
    EASE: 'ease',
    FUNCTION: 'function',
    DEFAULT_EASE: 'linear',
    DEFAULT_TWEEN_PROP: 'all',
    DEFAULT_TIME_UNIT: 'ms',
    CHILDLIST: 'childList'
  };

  /* Config - used for setting a default ease / outputting logs */
  var tracksConfig = window.TracksConfig;
  var defaultEase = typeDefs.DEFAULT_EASE;
  var logs = false;

  /*
  Easing
  */
  function getEasingFromProps(fromProps, toProps) {
    var hasProp = Object.prototype.hasOwnProperty;
    var props = [
      { p: fromProps, equation: defaultEase },
      { p: toProps, equation: defaultEase }
    ];

    // set easing equations
    props.forEach(function(list) {
      if (
        hasProp.call(list.p, typeDefs.EASE) &&
        hasProp.call(easeEquationMap, list.p.ease)
      ) {
        list.equation = easeEquationMap[list.p.ease];
      }
    });

    var easing = {
      easingEquationFrom: props[0].equation,
      easingEquationTo: props[1].equation
    };

    return easing;
  }

  /*
  Apply animation
  */
  function applyAnimation(element, transitionTime, ease) {
    transitionAgents.forEach(function(agent) {
      element.style[agent] =
        typeDefs.DEFAULT_TWEEN_PROP +
        ' ' +
        transitionTime +
        typeDefs.DEFAULT_TIME_UNIT +
        ' ' +
        ease;
    });
  }

  /*
  Apply styles
  */
  function applyStyles(element, prop) {
    element.style[prop.key] = prop.value;
    if (prop.handler) {
      transformAgents.forEach(function(agent) {
        element.style[agent] = prop.handler(prop.value);
      });
    } else {
      element.style[prop.key] = prop.value;
    }
  }

  function identifierString(el) {
    var string = '';
    if (el.classList) {
      string += JSON.stringify(el.classList);
    }
    if (el.id) {
      string += el.id;
    }
    return string;
  }

  /*
  Reset styles
  */
  function resetStyles(element) {
    element.style.transition = '';
    transformAgents.forEach(function(agent) {
      element.style[agent] = '';
    });
  }

  function matchMutationElement(mixedIdentifier, mutationNodes) {
    return Array.from(mutationNodes).find(function(el) {
      return identifierString(el).indexOf(mixedIdentifier) > -1;
    });
  }

  function resetElementRemove(el) {
    el.remove = Element.prototype.remove;
  }

  function removeObserverFromList(index) {
    observerList.splice(index, 1);
  }

  function removeElement(el, onRemoved, identifier) {
    var removed = onRemoved(el);
    var elementIndex = observerList.indexOf(function(id) {
      return id.identifier === identifier;
    });

    if (typeof removed === typeDefs.OBJECT) {
      if (removed.then && typeof removed.then === typeDefs.FUNCTION) {
        removed.then(function() {
          configLog() && console.log('Tracks - internal - on complete done');
          resetElementRemove(el);
          removeObserverFromList(elementIndex);
          el.remove();
        });
      } else {
        if (removed.animation) {
          removed.animation.then(function() {
            resetElementRemove(el);
            removeObserverFromList(elementIndex);
            el.remove();
            if (removed.onComplete) {
              removed.onComplete();
            }
          });
        }
      }
    }
  }

  function alterElementRemove(el, onRemoved, identifier) {
    if (!el) {
      return;
    }
    el.onclick = null;
    el.remove = function() {
      removeElement(el, onRemoved, identifier);
    };
  }

  function configProp(prop) {
    return window.TracksConfig && window.TracksConfig[prop];
  }

  function configLog() {
    return configProp('logs') === true;
  }

  /*
  Observe elements
  */
  function observe(mutationsList, observer, identifier, onAdded, onRemoved) {
    onAdded = onAdded || null;
    onRemoved = onRemoved || null;

    var mixedIdentifier = identifier.replace(/[.,#]/g, '');
    for (var i = 0; i < mutationsList.length; i++) {
      var mutation = mutationsList[i];
      if (mutation.type === typeDefs.CHILDLIST) {
        if (mutation.addedNodes) {
          var matchedAddEl = matchMutationElement(
            mixedIdentifier,
            mutation.addedNodes
          );
          if (onRemoved != null) {
            alterElementRemove(matchedAddEl, onRemoved, identifier);
          }
          if (matchedAddEl) {
            if (onAdded != null) {
              onAdded(matchedAddEl);
            }
          }
        }
      }
    }
  }

  /*
  Tracks.on
  */
  function on(identifier, onAdded = null, onRemoved = null) {
    if (onAdded == null && onRemoved == null) {
      return console.error(
        'Tracks - Both onAdded / onRemoved arguments cannot be null'
      );
    }

    var supportsObservers =
          window.MutationObserver ||
          window.WebKitMutationObserver ||
          window.MozMutationObserver;

    if (!supportsObservers) {
      return console.error('Tracks - MutationObserver needs to be polyfilled');
    }

    if (onAdded != null && typeof onAdded !== typeDefs.FUNCTION) {
      return console.error('Tracks - onAdded argument is not a function');
    }

    var mObserver = new MutationObserver(function(mutationsList, observer) {
      observe(mutationsList, observer, identifier, onAdded, onRemoved);
    });

    if (JSON.stringify(observerList).indexOf(identifier) === -1) {
      observerList.push({ identifier, mObserver });
    } else {
      // Tracks - on identifier already in list
    }

    mObserver.observe(document.body, observerConfig);
  }

  /*
  Tracks.fromTo
  arguments:
  element: DOM element
  fromProps: Object, list of properties to animate from
  toProps: Object, list of properties to animate to
  duration: Seconds / milliseconds
  isReverse: Boolean, defaults to false
  */
  function fromTo(
    element,
    fromProps,
    toProps,
    duration = 1,
    isReverse = false
  ) {
    return new Promise(function(resolve, reject) {
      /*
      Validate args
      element, duration, fromProps, toProps
      */
      if (
        !element ||
                typeof fromProps !== typeDefs.OBJECT ||
                typeof toProps !== typeDefs.OBJECT
      ) {
        reject('incorrect args');
      }
      if (typeof window === typeDefs.UNDEFINED) {
        reject('no window');
      }
      if (Object.values(fromProps).length === 0) {
        reject('incorrect fromProps args');
      }
      if (Object.values(toProps).length === 0) {
        reject('incorrect toProps args');
      }
      if (typeof duration !== typeDefs.NUMBER || !duration) {
        reject('incorrect duration arg');
      }

      /* Global config */
      tracksConfig = window.TracksConfig;
      if (tracksConfig) {
        if (typeof configProp('ease') !== 'undefined') {
          var ease = tracksConfig.ease;
          defaultEase = easeEquationMap[ease]
            ? easeEquationMap[ease]
            : typeDefs.DEFAULT_EASE;
        }
      }

      var logElement = {
        element: element,
        fromState: fromProps,
        toState: toProps,
        duration: duration
      };
      configLog() && console.table(logElement);

      /*
      Give the element a default width and height if the properties haven't been specified
      */
      if (element.style.cssText.indexOf('width') === -1) {
        element.style.width = '0px';
      }
      if (element.style.cssText.indexOf('height') === -1) {
        element.style.height = '0px';
      }

      /*
      Loop through fromProps / toProps, push tween properties and assign a handler.
      */
      var easing = getEasingFromProps(fromProps, toProps);
      var easingEquationFrom = easing.easingEquationFrom;
      var easingEquationTo = easing.easingEquationTo;

      var delay = 0;
      var hasProp = Object.prototype.hasOwnProperty;
      var fromKeyPairs = [];
      var toKeyPairs = [];

      Object.entries(fromProps).forEach(function(prop) {
        var key = prop[0];
        var value = prop[1];

        /* Ignore ease when constructing [from] pairs */
        if (key === typeDefs.EASE && typeof value === typeDefs.STRING) {
          return;
        }

        if (!hasProp.call(keyMap, key)) {
          console.error('Tracks - invalid from key:', key);
          return;
        }
        fromKeyPairs.push({
          key,
          value,
          handler: keyMap[key]
        });
      });

      Object.entries(toProps).forEach(function(prop) {
        var key = prop[0];
        var value = prop[1];

        /* Add 'px' if needed */
        if (
          typeof value !== typeDefs.STRING && value.toString().indexOf('px') === -1
        ) {
          var needsPxSuffix = pxKeys.some(function(pxKey) {
            return pxKey.indexOf(key.toLowerCase()) > -1;
          });
          if (needsPxSuffix) {
            value = value + 'px';
          }
        }

        /* Ignore ease when constructing [to] pairs */
        if (key === typeDefs.EASE && typeof value === typeDefs.STRING) {
          return;
        }

        if (key === typeDefs.DELAY && typeof value === typeDefs.NUMBER) {
          delay = value;
        } else if (
          typeof value === typeDefs.NUMBER ||
                      typeof value === typeDefs.STRING
        ) {
          if (!hasProp.call(keyMap, key)) {
                          console.error("Tracks - invalid to key:", key); // eslint-disable-line
            return;
          }

          var tkp = {
            key,
            value,
            handler: keyMap[key]
          };

          toKeyPairs.push(tkp);
        }
      });

      /*
      Construct animation object
      */
      var animation = {
        from: fromKeyPairs,
        to: toKeyPairs
      };

      /*
      Animate
      Apply from properties to element
      Stall during the set animation delay
      Set the transition of the element based on its property and duration
      Stall during the animation duration before resolving
      Reset the element
      */

      var transitionTime = duration * 1000;
      var delayTime = delay * 1000;

      applyAnimation(element, transitionTime, easingEquationFrom);
      animation.from.forEach(function(prop) {
        applyStyles(element, prop);
      });

      window.requestAnimationFrame(function() {
        setTimeout(function() {
          applyAnimation(element, transitionTime, easingEquationTo);
          animation.to.forEach(function(prop) {
            applyStyles(element, prop);
          });

          setTimeout(function() {
            resetStyles(element);
            resolve();
          }, transitionTime);
        }, delayTime);
      });

      /* Add element to list (for reversing animations) */
      var toList = { el: element, fromProps, toProps, duration: duration };
      if (!elementList.includes(toList) && !isReverse) {
        elementList.push(toList);
        document.dispatchEvent(
          new CustomEvent('tracksListPush', { detail: { list: elementList } })
        );
      }
    });
  }
  function getList() {
    return elementList;
  }
  function reverse() {
    if (elementList.length === 0) {
      return;
    }

    /* Get last item */
    var item = elementList[elementList.length - 1];
    var rotation = item.toProps.rotation ? -item.toProps.rotation : false;
    var baseProps = item.fromProps;
    if (rotation) {
      baseProps = Object.assign(item.fromProps, { rotation: rotation });
    }
    /* Animate it */
    fromTo(item.el, item.toProps, baseProps, item.duration, true);
    /* Remove from list */
    elementList.pop();
    //* Dispatch list update */
    document.dispatchEvent(
      new CustomEvent('tracksListPop', {
        detail: { list: elementList }
      })
    );
  }

  /* Tracks */
  return {
    fromTo: fromTo,
    on: on,
    reverse: reverse,
    getList: getList
  };
})();
