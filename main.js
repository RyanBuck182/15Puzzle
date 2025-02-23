/*
Source:
https://www.cs.princeton.edu/courses/archive/spring21/cos226/assignments/8puzzle/specification.php

No direct code was used. Only used for the formula
for checking whether the puzzle is solvable.
*/

//getting html elements
let puzzleSizeSelector = document.getElementById('puzzleSizeDropdown');
let puzzleStatus = document.getElementById('status');
let puzzle = document.getElementById('puzzle');
let puzzleRegenerate = document.getElementById('regenerate');
let puzzleNumerals = document.getElementById('numerals');

//constants
const fadeOut = 'fade 0.075s linear 0s 1';
const fadeIn = fadeOut + ' reverse';
const highlightColor = 'darkblue';

//global variables
let emptyIndex;
let puzzleSize;
let numerals = 'Arabic';
let moveInProgress = false;

/**
 * Generates a solvable puzzle of the size selected in the dropdown menu.
 */
function generatePuzzle() {
    puzzle.innerHTML = '';
    
    //number of tiles in the puzzle
    puzzleSize = Number(puzzleSizeSelector.options[puzzleSizeSelector.selectedIndex].innerText);

    //randomizing puzzle
    let puzzleArray;
    do {
        puzzleArray = [];
        for (let i = 0; i < puzzleSize; i++)
            puzzleArray[i] = i + 1;
        puzzleArray[puzzleSize] = puzzleSize + 1;
        
        shuffleArray(puzzleArray);
    } while (!isPuzzleSolvable(puzzleArray));

    //displaying puzzle
    for (let i = 0; i <= puzzleSize; i++) {
        createCell(i, puzzleArray[i]);
        updateHighlighting(i);
        
        if (getCellFromIndex(i).value == puzzleSize + 1)
            emptyIndex = i;
    }

    //sets the status of the game
    setStatus();

    //making correct number of columns and rows
    let fraction = '1fr ';
    puzzle.style.gridTemplateColumns = fraction.repeat(Math.sqrt(puzzleSize + 1));
    puzzle.style.gridTemplateRows = fraction.repeat(Math.sqrt(puzzleSize + 1));
}

/**
 * Creates a cell of the puzzle.
 * @param {Number} index Index of the cell.
 * @param {String} value The value the cell displays.
 */
function createCell(index, value) {
    let cell = document.createElement('div');
    cell.className = 'cell';
    puzzle.appendChild(cell);
    setCellValue(index, value);

    cell.onclick = () => { makeMove(index) };
}

/**
 * Swaps the empty cell with one next to it. Plays animations to show this.
 * @param {Number} index The index of the cell the user wants to move.
 */
function makeMove(index) {
    if (!isValidCell(index))
        return;
    if (moveInProgress)
        return;

    moveInProgress = true;

    let oldEmptyCell = getCellFromIndex(emptyIndex);
    let newEmptyCell = getCellFromIndex(index);

    //fade out
    playAnimation(oldEmptyCell, fadeOut);
    playAnimation(newEmptyCell, fadeOut);

    //after fade out, fade in and finish move
    newEmptyCell.addEventListener('animationend', function continueMove() {
        //remove listener to avoid running code multiple times
        newEmptyCell.removeEventListener('animationend', continueMove);

        moveInProgress = false;
        
        //fade in
        playAnimation(oldEmptyCell, fadeIn);
        playAnimation(newEmptyCell, fadeIn);

        //swapping values
        let temp = oldEmptyCell.value;
        setCellValue(emptyIndex, newEmptyCell.value);
        setCellValue(index, temp);

        //update highlighting if any cells are now or no longer in the correct position
        updateHighlighting(emptyIndex);
        updateHighlighting(index);

        //updates the index of the empty cell
        emptyIndex = index;

        //updates the status of the game
        setStatus();
    });
}

/**
 * Returns true if the cell is adjacent to the empty cell.
 * @param {Number} index Index of the cell to check.
 * @returns {Boolean}
 */
function isValidCell(index) {
    if (index == emptyIndex + 1 && index % Math.sqrt(puzzleSize + 1) != 0)
        return true;
    else if (index == emptyIndex - 1 && emptyIndex % Math.sqrt(puzzleSize + 1) != 0)
        return true;
    else if (index == emptyIndex + Math.sqrt(puzzleSize + 1))
        return true;
    else if (index == emptyIndex - Math.sqrt(puzzleSize + 1))
        return true;
    else
        return false;
}

/**
 * Plays an animation on the selected element.
 * @param {Element} cell
 * @param {String} animation
 */
function playAnimation(cell, animation) {
    cell.style.animation = '';
    cell.offsetWidth;
    cell.style.animation = animation;
}

/**
 * Sets the background of a cell to blue if the cell is in the correct position.
 * @param {Number} index The index of the cell.
 */
function updateHighlighting(index) {
    if (isInCorrectPosition(index))
        getCellFromIndex(index).style.backgroundColor = highlightColor;
    else
        getCellFromIndex(index).style.backgroundColor = '';
}

/**
 * Returns if the cell is in the correct position.
 * @param {Number} index The index of the cell to check.
 * @returns {Boolean}
 */
function isInCorrectPosition(index) {
    return getCellFromIndex(index).value == (Number(index) + 1); 
}

/**
 * Sets the status. Ex: "4/15" or "You Win!"
 */
function setStatus() {
    let correctCount = 0;
    for (let i = 0; i < puzzleSize; i++) {
        if (getCellFromIndex(i).style.backgroundColor == highlightColor)
            correctCount++;
    }
    
    //displays win message if all cells are in the correct position
    if (correctCount == puzzleSize) {
        puzzleStatus.innerText = 'You Win!';
        return;
    }

    //displays number of cells in the correct position
    puzzleStatus.innerText = correctCount + '/' + puzzleSize;
}

/**
 * Gets a cell from its index.
 * @param {Number} index The index of the cell.
 * @returns {Element}
 */
function getCellFromIndex(index) {
    return document.getElementsByClassName('cell')[index];
}

/**
 * Set the value of a cell.
 * @param {Number} index The index of the cell.
 * @param {Number} value The value to set to the cell
 */
function setCellValue(index, value) {
    let cell = getCellFromIndex(index);
    cell.value = value;
    
    if (value == puzzleSize + 1)
        cell.innerText = '-';
    else
        if (numerals == 'Arabic')
            cell.innerText = value;
        else
            cell.innerText = arabicToRoman(value);
}

/**
 * Returns whether the current puzzle layout is solvable. See source at top of code.
 * @param {Array} puzzleArray Array representing the board layout.
 * @returns {Boolean}
 */
function isPuzzleSolvable(puzzleArray) {
    let inversions = sumInversions(puzzleArray);

    let evenAmountOfRowsAndColumns = Math.sqrt(puzzleSize + 1) % 2 == 0;
    if (evenAmountOfRowsAndColumns) { //even sized puzzle
        let emptyCellRow;
        for (let i = puzzleSize; i >= 0; i--) {
            if (puzzleArray[i] == puzzleSize + 1) {
                emptyCellRow = Math.ceil((i + 1) / Math.sqrt(puzzleSize + 1)) - 1;
                break;
            }
        }
                
        return (inversions + emptyCellRow) % 2 == 1;
    }
    else //odd sized puzzle
        return inversions % 2 == 0;
}

/**
 * Returns the total number of inversions in the puzzle. See source at top of code.
 * @param {Array} puzzleArray Array representing the board layout.
 * @returns {Number}
 */
function sumInversions(puzzleArray) {
    let inversions = 0;
    for (let i = 0; i < puzzleSize; i++)
        inversions += countInversions(puzzleArray, i);

    return inversions;
}

/**
 * Returns the number of inversions for a cell in the puzzle. See source at top of code.
 * @param {Array} puzzleArray Array representing the board layout.
 * @param {Number} index The index of the cell to check inversions for.
 * @returns 
 */
function countInversions(puzzleArray, index) {
    let comparerValue = puzzleArray[index];
    if (comparerValue == puzzleSize + 1)
        return 0;

    //counting inversions
    let inversions = 0;
    for (let i = index + 1; i <= puzzleSize; i++) {
        let comparedToValue = puzzleArray[i];

        if (comparedToValue == puzzleSize + 1)
            continue;

        if (Number(comparerValue) > Number(comparedToValue))
            inversions++;
    }

    return inversions;
}

/**
 * Swaps the numerals on the board between arabic and roman.
 */
function swapNumerals() {
    if (numerals == 'Arabic') {
        numerals = 'Roman';
        puzzleNumerals.innerText = 'Arabic Numerals';
    }
    else {
        numerals = 'Arabic';
        puzzleNumerals.innerText = 'Roman Numerals';
    }

    for (let i = 0; i <= puzzleSize; i++) 
        setCellValue(i, getCellFromIndex(i).value);
}

/**
 * Returns the number represented by roman numerals. Only goes up to 15.
 * @param {Number} number 
 * @returns {String}
 */
function arabicToRoman(number) {
    let romanNumber = '';
    
    while (number / 10 >= 1) {
        romanNumber += 'X'
        number -= 10;
    }
    if (number == 9) {
        romanNumber += 'IX';
        number -= 9;
    }
    while (number / 5 >= 1) {
        romanNumber += 'V'
        number -= 5;
    }
    if (number == 4) {
        romanNumber += 'IV';
        number -= 4;
    }
    while (number > 0) {
        romanNumber += 'I'
        number -= 1;
    }

    return romanNumber;
}

/**
 * Shuffles an array.
 * @param {Array} array Array to shuffle.
 */
function shuffleArray(array) {
    for (let i = 0; i < array.length; i++) {
        let randomIndex = Math.floor(Math.random() * array.length);
        swap(array, i, randomIndex);
    }
}

/**
 * Swaps two elements of an array.
 * @param {Array} array Array to swap within.
 * @param {Number} index1 Index of the first element.
 * @param {Number} index2 Index of the second element.
 */
function swap(array, index1, index2) {
    let temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
}

//connecting dropdown menu and regnerate button to generatePuzzle 
puzzleSizeSelector.onchange = generatePuzzle;
puzzleRegenerate.onclick = generatePuzzle;

//connecting numerals button to swapNumerals
puzzleNumerals.onclick = swapNumerals;

//creating the first puzzle
generatePuzzle();