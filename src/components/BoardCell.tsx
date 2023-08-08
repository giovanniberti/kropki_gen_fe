import {cellComparator, compareConstraintsByCells, Constraint, DotType} from "../model/Constraints";

interface BoardCellProps {
    id?: string,
    constraints: Constraint[]
}

function computeConstraintStyle(constraint: Constraint): { style: any, value: any } {
    let value = undefined;
    let style = undefined;

    if (constraint.type === "cell") {
        value = constraint.value;
    } else {
        const [cell1, cell2] = Array.from(constraint.cells()).sort(cellComparator);
        let position;
        if (cell1[0] == cell2[0] - 1) {
            position = "bottom";

            if (cell1[1] != cell2[1]) {
                console.error("Invalid constraint between cells:" + JSON.stringify([cell1, cell2]))
            }
        } else if (cell1[1] == cell2[1] - 1) {
            position = "right";

            if (cell1[0] != cell2[0]) {
                console.error("Invalid constraint between cells:" + JSON.stringify([cell1, cell2]))
            }
        } else {
            console.error("Invalid constraint between cells:" + JSON.stringify([cell1, cell2]))
        }

        style = [position, constraint.dotType == DotType.BLACK ? "black" : "white"];
    }

    return {
        value,
        style
    };
}

export function BoardCell({constraints, id}: BoardCellProps) {
    const cellData = constraints.reduce((data, constraint) => {
        const newStyle = computeConstraintStyle(constraint);
        return {
            ...JSON.parse(JSON.stringify(data)),
            ...JSON.parse(JSON.stringify(newStyle))
        }
    }, { value: undefined, style: undefined });

    if (cellData.style) {
        console.log(JSON.stringify(cellData.style));
    }

    return (
        <div id={id} className="board-cell">
            <span className="board-text">{cellData.value}</span>
            <span className={"board-underline " + cellData.style?.join(" ")} />
        </div>
    );
}
