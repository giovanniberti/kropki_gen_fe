export type Constraint = ConstraintMethods & (CellConstraint | DotConstraint)

interface ConstraintMethods {
    cells(): Set<Cell>
    referenceCell(): Cell
}

export type Cell = [number, number]

export class CellConstraint implements ConstraintMethods {
    cell: Cell
    value: number
    type: "cell"

    constructor(cell: Cell, value: number) {
        this.cell = cell;
        this.value = value;
        this.type = "cell";
    }

    cells(): Set<Cell> {
        return new Set<Cell>([this.cell]);
    }

    referenceCell(): Cell {
        return this.cell;
    }
}

export enum DotType {
    WHITE,
    BLACK
}

export class DotConstraint implements ConstraintMethods {
    _cells: [Cell, Cell]
    dotType: DotType
    type: "dot"

    constructor(cells: [Cell, Cell], dotType: DotType) {
        this._cells = cells;
        this.dotType = dotType;
        this.type = "dot";
    }

    cells(): Set<Cell> {
        return new Set(this._cells);
    }

    referenceCell(): Cell {
     return this._cells[0];
    }
}

function numberComparator(a: number, b: number): number {
    return a - b;
}

export function cellComparator(a: Cell, b: Cell): number {
    const [coordA1, coordA2] = a;
    const [coordB1, coordB2] = b;

    const firstCoordComparison = numberComparator(coordA1, coordB1);

    if (firstCoordComparison != 0) {
        return firstCoordComparison;
    } else {
        // Tie-break with second coordinate
        return numberComparator(coordA2, coordB2);
    }
}

export function referenceCell(constraint: Constraint): Cell {
    switch (constraint.type) {
        case "cell": {
            return constraint.cell
        }
        case "dot": {
            const sortedCells = constraint._cells.sort(cellComparator);
            return sortedCells[0];
        }
    }
}

export function compareConstraintsByCells(a: Constraint, b: Constraint): number {
    const referenceCellA = referenceCell(a);
    const referenceCellB = referenceCell(b);

    return cellComparator(referenceCellA, referenceCellB)
}
