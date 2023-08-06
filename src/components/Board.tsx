import {Cell, Constraint, referenceCell} from "../model/Constraints";
import "./board.css";
import {BoardCell} from "./BoardCell";

interface BoardProps {
    constraints: Constraint[]
}

export function Board({ constraints }: BoardProps) {
    const constraintsByCell: Record<Cell, Constraint[]> = {};

    constraints.forEach(c => {
        const cell = referenceCell(c);
        if (cell in constraintsByCell) {
            constraintsByCell[cell].push(c);
        } else {
            constraintsByCell[cell] = [c];
        }
    });

    console.log("constraints by cell");
    console.log(constraintsByCell);

    const grid = [];
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            grid.push([i, j]);

            if (!([i, j].toString() in constraintsByCell)) {
                constraintsByCell[[i, j]] = [];
            }
        }
    }

    return (
        <div className="board">
            {grid.map(coord =>
                <BoardCell
                    key={`${coord[0]}_${coord[1]}`}
                    id={`${coord[0]}_${coord[1]}`}
                    constraints={constraintsByCell[coord]}
                />
            )}
        </div>
    );
}
