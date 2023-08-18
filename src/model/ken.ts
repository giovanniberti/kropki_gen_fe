import { pipe } from "fp-ts/lib/function";
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

                console.log(`Parsing value: ${value} ${Number(value)}`);
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

            console.dir(matches);
            console.log(`Matched value for dot: ${value}`);
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

        console.log(`New constraints for row ${rowIndex}:`);
        console.dir(rowConstraints);

        if (state.remainingInput != "") {
            console.error(`Error while parsing row ${rowIndex}`);
        }

        rowIndex += 1;
    }

    return constraints;
}
