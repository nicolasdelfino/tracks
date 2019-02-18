<img src="/logo.png" width="300">

# tracks.js

#### Description:

Tracks animates DOM elements from one state to another by temporarily injecting styles (Tracks.fromTo), its real strength is its capability to listen to the creation and deletion of DOM elements by using the MutationObserver API (Tracks.on).

##### 2.61kb gzipped 

#### Methods

##### Tracks.on (selector / mount fn -> el / unmount fn -> el)
Can be used in two ways, if you don't need to latch on the unmount hook just return the fromTo animation:
```js
Tracks.on(
  selector,
  async el => {
    await Tracks.fromTo(el, stateA, stateB, 0.5);
    console.log('Tracks - add animation complete!');
  },
  el => Tracks.fromTo(el, stateB, stateA, 0.5), // <- return animation to Tracks
);
````

If you do care, return an object that contains an animation property and an onComplete method:
```js
Tracks.on(
  selector,
  async el => {
    await Tracks.fromTo(el, stateA, stateB, 0.5);
    console.log('Tracks - add animation complete');
  },
  el => ({
    animation: Tracks.fromTo(el, stateB, stateA, 0.5),
    onComplete: () => {
      console.log('Tracks - external - on complete done');
    },
  }),
);
````

##### Tracks.fromTo
```js
// states
const stateA = { width: 0, height: 0, opacity: 0 };
const stateB = { width: 100, height: 100, opacity: 1 };

Tracks.fromTo(selector, stateB, stateA, 0.5)
````

##### Tracks.reverse
Reverse the latest animation made with Tracks (flips states).

##### Tracks.getList
Outputs elements that have been animated with Tracks.
