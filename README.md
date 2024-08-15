# Compact Console Log

CCL (Compact Console Log) is a VSCode extension that provides an easy way to debug your JavaScript and TypeScript code by logging data to the console.

## TL;DR

1. Select the code you want to log.
2. Press `Ctrl + Shift + L` to log the selected code to the console.
3. Run your code and look at the console.
4. Press `Ctrl + Shift + L` on the logged data to remove the log.

![DemoVSCode](https://i.imgur.com/iLPfCOs.gif "DemoVSCode")

![DemoConsole](https://i.imgur.com/m417L5k.gif "DemoConsole")

## Installation

You can install the extension from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=ibentimor.compact-console-log).

## Example

Let's understand how it works with an example:

```javascript
function add(a, b) {
    return a - b;
}

const numbers1 = [[1, 2], [3, 4], [5, 6]];

console.log(numbers1.map(([a, b]) => add(a, b)).reduce((a, b) => a + b));

const numbers2 = [[7, 8], [9, 10], [11, 12]];

console.log(numbers2.map(([a, b]) => add(a, b)).reduce((a, b) => a + b));

```

Oh no! We have a bug! We expect the outputs to be `21` and `57` but the actual outputs are both `-3`. We believe that the `add` function is the culprit and we want to check our assumption. 

Without CCL, we would have to add a `console.log` statement to each one of the map functions and log the value returned by the `add` function. 

```javascript
function add(a, b) {
    return a - b;
}

const numbers1 = [[1, 2], [3, 4], [5, 6]];

console.log(numbers1.map(([a, b]) => {
    const result = add(a, b);
    console.log("1", result);
    return result;
}).reduce((a, b) => a + b));

const numbers2 = [[7, 8], [9, 10], [11, 12]];

console.log(numbers2.map(([a, b]) => {
    const result = add(a, b);
    console.log("2", result);
    return result;
}).reduce((a, b) => a + b));

```

We look at our console and see that our `add` function is returning `-1` every time. We realize that we made a mistake in the `add` function and we should have used the `+` operator instead of the `-` operator. 

But look how much code we had to write just to debug the `add` function! Don't forget that we need to remove these `console.log` statements once we are done debugging. What a pain!

With CCL, we can simply select the `add` function and press `Ctrl + Shift + L` to log the return value of the function to the console. Then it looks something like that: 

```javascript
function add(a, b) {
    return a - b;
}

const numbers1 = [[1, 2], [3, 4], [5, 6]];

console.log(numbers1.map(([a, b]) => 📢 add(a, b) ).reduce((a, b) => a + b));

const numbers2 = [[7, 8], [9, 10], [11, 12]];

console.log(numbers2.map(([a, b]) => 📢 add(a, b) ).reduce((a, b) => a + b));

```

Now we run the code and look at the console. Once again, we see that the `add` function is returning `-1` every time. Once we are done debugging, we can simply put our cursor on the logged data and press `Ctrl + Shift + L` to remove the log.

P.S. How can we distinguish between the two logs? The `📢` emoji and the line number are added to the colorful log. So we never get confused in our debugging.