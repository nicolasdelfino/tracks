window.Tracks = (function () {
  /*
  * Tracks
  * Animates DOM elements by temporarily injecting inline styles
  */

  /*
  * elementList - used for reversing animations
  * observerList - tracks observed elements
  */
  const elementList = [];
  const observerList = [];

  /* Options for the observer (which mutations to observe) */
  const observerConfig = { attributes: false, childList: true, subtree: true };

  /*
  * Valid base keys, transform keys and their handlers
  */
  const baseKeys = {
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
    'font-size': null,
    'border-radius': null,
    'background-color': null,
    'border-width': null,
    'border-color': null,
    'pointer-events': null
  };

  const keyMap = {
    ...baseKeys,
    x: value => `translateX(${value}px)`,
    y: value => `translateY(${value}px)`,
    skewX: value => `skewX(${value})`,
    skewY: value => `skewY(${value})`,
    scaleX: value => `scaleX(${value})`,
    scaleY: value => `scaleY(${value})`,
    rotation: value => `rotate(${value}deg)`,
    scale: value => `scale(${value})`
  };

  /*
  * Easing equations
  */
  const easeEquationMap = {
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
  * Transform agents
  */
  const transformAgents = [
    'webkitTransform',
    'MozTransform',
    'msTransform',
    'OTransform',
    'transform'
  ];

  /*
  * Transition agents
  */
  const transitionAgents = [
    '-webkit-transition',
    '-moz-transition',
    '-o-transition',
    'transition'
  ];

  /*
  * Types
  */
  const typeDefs = {
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

  /*
  * Easing
  */
  const getEasingFromProps = (fromProps, toProps) => {
    const config = window.TracksConfig;
    const hasProp = Object.prototype.hasOwnProperty;

    // use ease from config if present
    let defaultEase = typeDefs.DEFAULT_EASE;
    if (config && hasProp.call(config, 'ease')) {
      defaultEase = hasProp.call(easeEquationMap, config.ease) ? easeEquationMap[config.ease] : typeDefs.DEFAULT_EASE;
    }

    const props = [
      { p: fromProps, equation: defaultEase },
      { p: toProps, equation: defaultEase }
    ];

    // set easing equations
    props.forEach(list => {
      if (
        hasProp.call(list.p, typeDefs.EASE) &&
        hasProp.call(easeEquationMap, list.p.ease)
      ) {
        list.equation = easeEquationMap[list.p.ease];
      }
    });

    const easing = {
      easingEquationFrom: props[0].equation,
      easingEquationTo: props[1].equation
    };

    // console.table(easing);
    return easing;
  };

  /*
  * Apply animation
  */
  const applyAnimation = (element, transitionTime, ease) => {
    transitionAgents.forEach(
      agent =>
        (element.style[agent] = `${
          typeDefs.DEFAULT_TWEEN_PROP
        } ${transitionTime}${typeDefs.DEFAULT_TIME_UNIT} ${ease}`)
    );
  };

  /*
  * Apply styles
  */
  const applyStyles = (element, prop) => {
    element.style[prop.key] = prop.value;
    if (prop.handler) {
      transformAgents.forEach(
        agent => (element.style[agent] = prop.handler(prop.value))
      );
    } else {
      element.style[prop.key] = prop.value;
    }
  };

  /*
  * Reset styles
  */
  const resetStyles = element => {
    element.style.transition = '';
    transformAgents.forEach(agent => (element.style[agent] = ''));
  };

  const matchMutationElement = (mixedIdentifier, mutationNodes) => ([...mutationNodes].find(el =>
    identifierString(el).indexOf(mixedIdentifier) > -1
  ));

  const identifierString = el => {
    let string = '';
    if (el.classList) {
      string += JSON.stringify(el.classList);
    }
    if (el.id) {
      string += el.id;
    }
    return string;
  };

  const resetElementRemove = el => {
    el.remove = Element.prototype.remove;
  };

  const removeObserverFromList = index => {
    observerList.splice(index, 1);
  };

  const removeElement = (el, onRemoved, identifier) => {
    const removed = onRemoved(el);
    const elementIndex = observerList.indexOf((id) => id.identifier === identifier);

    if (typeof removed === typeDefs.OBJECT) {
      if (removed.then && typeof removed.then === typeDefs.FUNCTION) {
        removed.then(() => {
          // console.log('Tracks - internal - on complete done');
          resetElementRemove(el);
          removeObserverFromList(elementIndex);
          el.remove();
        });
      } else {
        if (removed.animation) {
          removed.animation.then(() => {
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
  };

  const alterElementRemove = (el, onRemoved, identifier) => {
    if (!el) {
      return;
    }
    el.onclick = null;
    el.remove = function () {
      removeElement(el, onRemoved, identifier);
    };
  };

  /*
  * Observe elements
  */
  const observe = (mutationsList, observer, identifier, onAdded = null, onRemoved = null) => {
    const mixedIdentifier = identifier.replace(/[.,#]/g, '');
    for (var mutation of mutationsList) {
      if (mutation.type === typeDefs.CHILDLIST) {
        if (mutation.addedNodes) {
          const matchedAddEl = matchMutationElement(mixedIdentifier, mutation.addedNodes);
          if (onRemoved != null) {
            alterElementRemove(matchedAddEl, onRemoved, identifier);
          }
          if (matchedAddEl) {
            // console.log(`element "${mixedIdentifier}" added`);
            if (onAdded != null) {
              onAdded(matchedAddEl);
            }
          }
        }
      }
    }
  };

  return {

    /*
    * on
    */
    on: function (identifier, onAdded = null, onRemoved = null) {
      if (onAdded == null && onRemoved == null) {
        return console.error('Tracks - Both onAdded / onRemoved arguments cannot be null');
      }

      if (onAdded != null && typeof onAdded !== typeDefs.FUNCTION) {
        return console.error('Tracks - onAdded argument is not a function');
      }

      const mObserver = new MutationObserver((mutationsList, observer) =>
        observe(mutationsList, observer, identifier, onAdded, onRemoved));

      if (JSON.stringify(observerList).indexOf(identifier) === -1) {
        observerList.push({ identifier, mObserver });
        // console.log('Tracks - observerList', observerList);
      } else {
        // console.log('Tracks - on identifier already in list');
      }

      mObserver.observe(document.body, observerConfig);
    },

    /*
    * fromTo
    * arguments:
    * element: DOM element
    * fromProps: Object, list of properties to animate from
    * toProps: Object, list of properties to animate to
    * duration: Seconds / milliseconds
    * isReverse: Boolean, defaults to false
    */
    fromTo: function (
      element,
      fromProps,
      toProps,
      duration = 1,
      isReverse = false
    ) {
      return new Promise((resolve, reject) => {
        /*
        * Validate args
        * element, duration, fromProps, toProps
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

        /*
        * Give the element a default width and height if the properties haven't been specified
        */
        if (element.style.cssText.indexOf('width') === -1) {
          element.style.width = '0px';
        }
        if (element.style.cssText.indexOf('height') === -1) {
          element.style.height = '0px';
        }

        /*
        * Loop through fromProps / toProps, push tween properties and assign a handler.
        */
        const { easingEquationFrom, easingEquationTo } = getEasingFromProps(
          fromProps,
          toProps
        );

        let delay = 0;
        const hasProp = Object.prototype.hasOwnProperty;
        const fromKeyPairs = [];
        const toKeyPairs = [];

        Object.entries(fromProps).forEach(prop => {
          const key = prop[0];
          const value = prop[1];

          /* ignore ease when constructing [from] pairs */
          if (key === typeDefs.EASE && typeof value === typeDefs.STRING) {
            return;
          }

          if (!hasProp.call(keyMap, key)) {
            console.error("Tracks - invalid from key:", key); // eslint-disable-line
            return;
          }
          fromKeyPairs.push({
            key,
            value,
            handler: keyMap[key]
          });
        });

        Object.entries(toProps).forEach(prop => {
          const key = prop[0];
          let value = prop[1];

          /* add 'px' if needed to widht / height */
          if (key === 'height' || key === 'width') {
            value = value.toString().indexOf('px') === -1 ? `${value}px` : value;
          }

          /* ignore ease when constructing [to] pairs */
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

            const tkp = {
              key,
              value,
              handler: keyMap[key]
            };

            // console.log(tkp);
            toKeyPairs.push(tkp);
          }
        });

        /*
        * Construct animation object
        */
        const animation = {
          from: fromKeyPairs,
          to: toKeyPairs
        };

        /*
        * Animate
        * Apply from properties to element
        * Stall during the set animation delay
        * Set the transition of the element based on its property and duration
        * Stall during the animation duration before resolving
        * Reset the element
        */

        const transitionTime = duration * 1000;
        const delayTime = delay * 1000;

        applyAnimation(element, transitionTime, easingEquationFrom);
        animation.from.forEach(prop => {
          applyStyles(element, prop);
        });

        window.requestAnimationFrame(() => {
          setTimeout(() => {
            applyAnimation(element, transitionTime, easingEquationTo);
            animation.to.forEach(prop => {
              applyStyles(element, prop);
            });

            setTimeout(() => {
              resetStyles(element);
              resolve();
            }, transitionTime);
          }, delayTime);
        });

        // add element to list (for reversing animations)
        const toList = { el: element, fromProps, toProps, duration: duration };
        if (!elementList.includes(toList) && !isReverse) {
          elementList.push(toList);
          document.dispatchEvent(new CustomEvent('tracksListPush', { detail: { list: elementList } }));
        }
      });
    },
    getList: function () {
      return elementList;
    },
    reverse: function () {
      if (elementList.length === 0) {
        return;
      }
      // console.table(this.getList());
      // get last item
      const item = elementList[elementList.length - 1];
      const rotation = item.toProps.rotation ? -item.toProps.rotation : false;
      let baseProps = item.fromProps;
      if (rotation) {
        baseProps = { ...item.fromProps, rotation: rotation };
      }
      // animate it
      this.fromTo(item.el, item.toProps, baseProps, item.duration, true);
      // remove from list
      elementList.pop();
      // dispatch list update
      document.dispatchEvent(new CustomEvent('tracksListPop', { detail: { list: elementList } }));
    }
  };
})();
