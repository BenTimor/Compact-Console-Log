
# Compact Console Log (CCL)

CCL (Compact Console Log) is a Visual Studio Code extension designed to simplify debugging in JavaScript and TypeScript by streamlining console logging.

## Quick Overview

1. Highlight the code you want to log.
2. Press `Ctrl + Alt + L` to log your selected code to the console.
3. Execute your code and observe the output in the console.
4. To remove the log, just press `Ctrl + Alt + L` on the logged statement. You can also remove all logs at once by pressing `Ctrl + Alt + K`.

![DemoVSCode](https://i.imgur.com/iLPfCOs.gif "DemoVSCode")

![DemoConsole](https://i.imgur.com/m417L5k.gif "DemoConsole")

## Installation

You can easily install this extension from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=ibentimor.compact-console-log).

## Usage Example

Here’s a simple example to illustrate how CCL works:

```javascript
function add(a, b) {
    return a - b;
}

const numbers1 = [[1, 2], [3, 4], [5, 6]];

console.log(numbers1.map(([a, b]) => add(a, b)).reduce((a, b) => a + b));

const numbers2 = [[7, 8], [9, 10], [11, 12]];

console.log(numbers2.map(([a, b]) => add(a, b)).reduce((a, b) => a + b));
```

Oops! We seem to have a bug. We expect the outputs to be `21` and `57`, but instead, we’re getting `-3` for both. It appears that our `add` function is malfunctioning, and we need to investigate.

Without CCL, we would have to manually insert `console.log` statements in each mapping function to track the return value of `add`.

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

Upon checking the console output, we can see that our `add` function consistently returns `-1`. This leads us to discover that we mistakenly used the `-` operator instead of `+`.

However, consider how much additional code we wrote just to debug this! Plus, we’ll need to remember to clean up those `console.log` statements afterward—what a hassle!

With CCL, we can simply select the `add` function and press `Ctrl + Alt + L` to log its return value easily. This is what it looks like:

```javascript
function add(a, b) {
    return a - b;
}

const numbers1 = [[1, 2], [3, 4], [5, 6]];

console.log(numbers1.map(([a, b]) => 📢 add(a, b)).reduce((a, b) => a + b));

const numbers2 = [[7, 8], [9, 10], [11, 12]];

console.log(numbers2.map(([a, b]) => 📢 add(a, b)).reduce((a, b) => a + b));
```

After running the code again and checking the console, we observe the `add` function still returns `-1`. Once we finish debugging, it’s a breeze to remove the log—we just place the cursor over the logged value and hit `Ctrl + Alt + L` again.

### P.S. 
To differentiate between various logs, the `📢` emoji along with the line number is appended to the colorful log, ensuring you won’t get confused during debugging.

## Features

### Log Selected Code

Select the code you want to log and press `Ctrl + Alt + L` to log it to the console.
If you want to select one word, you can put the cursor on the word and press `Ctrl + Alt + L`.

### Remove Log

To remove a log, place the cursor over the logged value and press `Ctrl + Alt + L`.

### Remove All Logs

To remove all logs at once, press `Ctrl + Alt + K`.

### Asynchronous Functions Support

CCL supports logging asynchronous functions and promises. You can log the return value of asynchronous functions and promises by selecting the function or promise and pressing `Ctrl + Alt + L`.
