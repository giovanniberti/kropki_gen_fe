import {pipe} from "fp-ts/lib/function";
import {Cell, CellConstraint, Constraint, DotConstraint, DotType} from "./Constraints";
import * as S from "fp-ts/lib/State";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";

function isValidValue(value: number) {
    return value >= 1 && value <= 9;
}

function isValidDot(value: string) {
    return value == "w" || value == "x" || value == "k";
}

type ParserState = {
    currentCell: O.Option<Cell>,
    remainingInput: string,
    parsedConstraints: Constraint[]
}

function nextCellForRow(cell: Cell): O.Option<Cell> {
    if (cell[1] == 8) {
        return O.none;
    } else {
        return O.some([cell[0], cell[1] + 1]);
    }
}

type SParserState = [Constraint[], ParserState];

const consumeValue: S.State<ParserState, Constraint[]> = (s) => {
    const oldState = [s.parsedConstraints, s] as SParserState;
    const input = s.remainingInput;

    if (input.length > 0 && input[0].match(/^\d/)) {
        return pipe(
            s.currentCell,
            O.flatMap(cell => {
                const value = input[0];

                if (!isValidValue(Number(value))) {
                    return O.none;
                }

                const newConstraints = [...s.parsedConstraints, new CellConstraint(cell, Number(value))];

                const newState: ParserState = {
                    currentCell: nextCellForRow(cell),
                    remainingInput: input.slice(1),
                    parsedConstraints: newConstraints
                };

                return O.some([newState.parsedConstraints, newState] as SParserState);
            }),
            O.getOrElse(() => oldState)
        );
    }

    return oldState; 

};

const consumeDotConstraint: S.State<ParserState, Constraint[]> = (s) => {
    const oldState = [s.parsedConstraints, s] as SParserState;
    const input = s.remainingInput;
    const dotFormat = /^\((\d?)((?:w|x|k){2})\)/;
    const matches = input.match(dotFormat);

    const toDot: (encoded: string) => O.Option<DotType> = (encoded: string) => {
        return pipe(
            O.of(encoded),
            O.filter(isValidDot),
            O.flatMap(s => {
                if (s == "w") {
                    return O.some(DotType.WHITE);
                } else if (s == "k") {
                    return O.some(DotType.BLACK);
                } else {
                    return O.none;
                }
            })
        );
    };

    const parseDotConstraints = ([bottom, right]: [string, string]) => {
        const parseConstraint = (encoded: string, constraintNextCell: (c: Cell) => Cell) =>  pipe(
            O.Do,
            O.bind('type', () => toDot(encoded)),
            O.bind('cell', () => s.currentCell),
            O.map(({ type, cell }) => new DotConstraint([cell, constraintNextCell(cell)], type))
        );

        const bottomConstraint = parseConstraint(bottom, bottomCell);
        const rightConstraint = parseConstraint(right, rightCell);

        return [bottomConstraint, rightConstraint];
    };

    const bottomCell = (cell: Cell) => [cell[0] + 1, cell[1]] as Cell;
    const rightCell = (cell: Cell) => [cell[0], cell[1] + 1] as Cell;

    if (matches != null) {
        const newConstraints: Constraint[] = [];
        let newInput = input;

        if (matches[1] == "") {
            // No value constraint
            const encoded = matches[2].split("") as [string, string];

            const dotConstraints = pipe(
                parseDotConstraints(encoded),
                A.compact
            );

            newConstraints.push(...dotConstraints);
            newInput = input.slice(matches[0].length);
        } else {
            const value = matches[1];
            const encoded = matches[2].split("") as [string, string];

            const dotConstraints = pipe(
                parseDotConstraints(encoded),
                A.compact,
            );

            pipe(
                s.currentCell,
                O.map(c => new CellConstraint(c, Number(value))),
                O.map(c => newConstraints.push(c))
            );

            newConstraints.push(...dotConstraints);
            newInput = input.slice(matches[0].length);
        }

        const newState: SParserState = pipe(
            s.currentCell,
            O.map(cell => ({
                currentCell: nextCellForRow(cell),
                remainingInput: newInput,
                parsedConstraints: s.parsedConstraints.concat(newConstraints)
            })),
            O.map(n => [n.parsedConstraints, n] as SParserState),
            O.getOrElse(() => oldState)
        );

        return newState;
    }

    return oldState;
};

const consumeEmptyCell: S.State<ParserState, Constraint[]> = (s) => {
    const oldState = [s.parsedConstraints, s] as SParserState;
    const input = s.remainingInput;
    const emptyCellFormat = /^[A-H]/;
    const matches = input.match(emptyCellFormat);

    const letterMap: Record<string, number> = {
        'A': 1,
        'B': 2,
        'C': 3,
        'D': 4,
        'E': 5,
        'F': 6,
        'G': 7,
        'H': 8
    };

    const repeatApply = <T>(f: (arg: T) => T, arg: T, n: number): T => {
        if (n < 1) {
            throw new Error("n must be positive!");
        }

        if (n == 1) {
            return f(arg);
        } else {
            return repeatApply(f, f(arg), n - 1);
        }
    }

    if (matches != null) {
        const letter = matches[0];
        const newInput = input.slice(1);

        const value = letterMap[letter];

        const newCell = repeatApply(
            pipe(O.chain(nextCellForRow)),
            s.currentCell,
            value
        );

        const newState = {
            currentCell: newCell,
            remainingInput: newInput,
            parsedConstraints: s.parsedConstraints
        };

        return [newState.parsedConstraints, newState];
    }

    return oldState;
};

function changesState<S, A>(candidate: S.State<S, A>): (initialState: S) => boolean {
    return (input: S) => {
        const finalState = pipe(
            candidate,
            S.execute(input)
        );

        return input != finalState;
    }
}

function alt<S, A>(alternatives: S.State<S, A>[]): (arg: S) => O.Option<S.State<S, A>> {
    return input =>
        pipe(
            alternatives,
            A.findFirst(s => changesState(s)(input))
        );
}

function parseCell(currentState: ParserState): O.Option<S.State<ParserState, Constraint[]>> {
    return pipe(
        currentState,
        alt([consumeValue, consumeDotConstraint, consumeEmptyCell]),
    );
}

const liftParser: S.State<ParserState, Constraint[]> = (s: ParserState) => [s.parsedConstraints, s];

const parseRow: S.State<ParserState, Constraint[]> = (initialState: ParserState) => {
    return pipe(
        initialState,
        parseCell,
        O.map(s => parseRow(pipe(s, S.execute(initialState)))),
        O.getOrElse(() => liftParser(initialState))
    );
}

export function decodeKEN(ken: string): Constraint[] {
    const rows = ken.split('/');
    if (rows.length != 9) {
        throw new Error(`Invalid number of rows (${rows.length}) in ken: "${ken}"`)
    }

    const constraints = [];

    let rowIndex = 0;
    for (let row of rows) {
        const initial: ParserState = {
            currentCell: O.some([rowIndex, 0]),
            remainingInput: row,
            parsedConstraints: []
        };

        const [rowConstraints, state] = parseRow(initial);

        constraints.push(...rowConstraints);

        if (state.remainingInput != "") {
            console.error(`Error while parsing row ${rowIndex}`);
        }

        rowIndex += 1;
    }

    return constraints;
}

function encodeDotType(dotType?: DotType): string | null {
    switch (dotType) {
        case undefined:
        case null: return null;
        case DotType.BLACK: return "k";
        case DotType.WHITE: return "w";
    }

    throw new Error("Shouldn't be possible!");
}

function encodeConstraintsForCell(constraints: Constraint[]): string {
    let value = undefined;
    let bottom = undefined;
    let right = undefined;

    for (const constraint of constraints) {
        if (constraint.type == "cell") {
            value = constraint.value;
        } else if (constraint.type == "dot") {
            const referenceCell = constraint.referenceCell();
            const otherCell = Array.from(constraint.cells()).filter(x => x != referenceCell)[0];

            if (referenceCell[0] == otherCell[0] && referenceCell[1] == otherCell[1] - 1) {
                right = constraint.dotType;
            } else if (referenceCell[0] == otherCell[0] - 1 && referenceCell[1] == otherCell[1]) {
                bottom = constraint.dotType;
            } else {
                throw Error("Invalid cell combination for dot constraint!");
            }
        }
    }

    if (value != undefined && bottom == undefined && right == undefined) {
        return value.toString();
    } else {
        value = value ?? "";
        bottom = encodeDotType(bottom) ?? "x";
        right = encodeDotType(right) ?? "x";

        return `(${value}${bottom}${right})`;
    }
}

function rleKEN(ken: string): string {
    let compactKen = "";
    let emptyCellSubstitutions: Record<number, string> = {
        1: "A",
        2: "B",
        3: "C",
        4: "D",
        5: "E",
        6: "F",
        7: "G",
        8: "H"
    }

    let aCount = 0;
    for (let char of ken) {
        if (char == "A") {
            aCount += 1;
        } else {
            if (aCount > 0) {
                compactKen += emptyCellSubstitutions[aCount];
                aCount = 0;
            }

            compactKen += char;
        }
    }

    return compactKen;
}

function gridCoords() {
    let coords = [];

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            coords.push([i, j]);
        }
    }

    return coords;
}

export function encodeConstraints(constraints: Constraint[]): string {
    console.dir(constraints);
    const constraintsByCells: Record<string, Set<Constraint>> = {}
    console.dir(constraintsByCells);

    for (let c of constraints) {
        if (!(c.referenceCell().toString() in constraintsByCells)) {
            constraintsByCells[c.referenceCell().toString()] = new Set();
        }

        constraintsByCells[c.referenceCell().toString()].add(c);
    }

    const grid = gridCoords().sort();
    let ken = "";

    for (let cell of grid) {
        console.log(`cell: ${cell}`);
        if (cell.toString() in constraintsByCells) {
            let encoded = encodeConstraintsForCell(Array.from(constraintsByCells[cell.toString()]));
            console.log(`Encode constraints: ${encoded}`)
            console.dir(constraintsByCells[cell.toString()]);
            ken += encoded;
        } else {
            ken += "A";
        }

        if (cell[1] == 8 && cell[0] != 8) {
            ken += "/";
        }
    }

    return rleKEN(ken);
}