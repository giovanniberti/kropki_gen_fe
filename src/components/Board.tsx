import {Constraint, referenceCell} from "../model/Constraints";
import "./board.css";
import {BoardCell} from "./BoardCell";

interface BoardProps {
    constraints: Constraint[]
}

export function Board({ constraints }: BoardProps) {
    const constraintsByCell: Record<string, Constraint[]> = {};

    constraints.forEach(c => {
        const cell = referenceCell(c);
        if (cell.toString() in constraintsByCell) {
            constraintsByCell[cell.toString()].push(c);
        } else {
            constraintsByCell[cell.toString()] = [c];
        }
    });

    const grid = [];
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            grid.push([i, j]);

            if (!([i, j].toString() in constraintsByCell)) {
                constraintsByCell[[i, j].toString()] = [];
            }
        }
    }

    return (
        <div className="board">
            {grid.map(coord =>
                <BoardCell
                    key={`${coord[0]}_${coord[1]}`}
                    id={`${coord[0]}_${coord[1]}`}
                    constraints={constraintsByCell[coord.toString()]}
                />
            )}
        </div>
    );
}
