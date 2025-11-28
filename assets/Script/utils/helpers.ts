
export type IndexInMatrix = [number, number]

const DIRECTIONS = {
  top: [-1, 0],
  bottom: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

export function getSiblingItem<T>(board: Array<Array<T>>, index: IndexInMatrix): Array<Array<T>> | null {
  const [rIndex, cIndex] = index;
  const startedItem = board[rIndex][cIndex];
  const siblings = getSiblingItemByPosition(board, index, startedItem);
  if (!siblings.length) {
    return null;
  }
  while (siblings.length) {
    const [rIndex, cIndex] = siblings.shift();
    markItem(board, [rIndex, cIndex]); // new line
    const newSiblings = getSiblingItemByPosition(board, [rIndex, cIndex], startedItem);
    siblings.push(...newSiblings);
  }
  return board;
}

function getSiblingItemByPosition<T>(board: Array<Array<T>>, index: IndexInMatrix, targetItem: T): Array<IndexInMatrix> {
  const siblings: Array<IndexInMatrix> = [];
  const [rIndex, cIndex] = index;

  for (let direction in DIRECTIONS) {
    const newRowIndex = rIndex + DIRECTIONS[direction][0];
    const newColumnIndex = cIndex + DIRECTIONS[direction][1];
    const siblingItem = isValidSibling(board, newRowIndex, newColumnIndex) ? board[newRowIndex][newColumnIndex] : null;

    if (siblingItem !== null && siblingItem === targetItem) {
      siblings.push([newRowIndex, newColumnIndex]);
    }
  }

  return siblings;
}

function markItem(board: Array<Array<unknown>>, [rIndex, cIndex]: IndexInMatrix): void {
  board[rIndex][cIndex] = null;
}

function isValidSibling(board: Array<Array<unknown>>, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

export function getCopyArrayByVerticalBoundary<T>(originBoard: Array<Array<T>>, startIndex: number, callback: (value: T) => any): Array<Array<number>> {
  const result = [];
  const arrLength = originBoard[0].length;
  for (let i = 0; i < arrLength; i++) {
    result.push([]);
    for (let j = 0; j < arrLength; j++) {
      result[i].push(callback(originBoard[i + startIndex][j]));
    }
  }
  return result;
}

export function getNormalizedIndex(index: IndexInMatrix, arrayBoundaryLength: number): IndexInMatrix {
  return index[0] >= arrayBoundaryLength ? [index[0] - arrayBoundaryLength, index[1]] : index;
}

export function getDenormalizedIndex(index: IndexInMatrix, arrayBoundaryLength: number): IndexInMatrix {
  return index[0] <= arrayBoundaryLength ? [index[0] + arrayBoundaryLength, index[1]] : index;
}
