import {cellComparator, Constraint, DotType} from "../model/Constraints";

interface BoardCellProps {
    id?: string,
    constraints: Constraint[],
    className?: string
}

function computeConstraintStyle(constraint: Constraint): { bottom: any; right: any; value: any } {
    let value = undefined;
    let bottom = undefined;
    let right = undefined;

    if (constraint.type === "cell") {
        value = constraint.value;
    } else {
        const [cell1, cell2] = Array.from(constraint.cells()).sort(cellComparator);

        if (cell1[0] == cell2[0] - 1) {
            bottom = constraint.dotType == DotType.BLACK ? "black" : "white";

            if (cell1[1] != cell2[1]) {
                console.error("Invalid constraint between cells:" + JSON.stringify([cell1, cell2]))
            }
        } else if (cell1[1] == cell2[1] - 1) {
            right = constraint.dotType == DotType.BLACK ? "black" : "white";

            if (cell1[0] != cell2[0]) {
                console.error("Invalid constraint between cells:" + JSON.stringify([cell1, cell2]))
            }
        } else {
            console.error("Invalid constraint between cells:" + JSON.stringify([cell1, cell2]))
        }
    }

    return {
        value,
        bottom,
        right
    };
}

export function BoardCell({constraints, id, className}: BoardCellProps) {
    const cellData = constraints.reduce((data, constraint) => {
        const newStyle = computeConstraintStyle(constraint);
        return {
            ...JSON.parse(JSON.stringify(data)),
            ...JSON.parse(JSON.stringify(newStyle))
        }
    }, { value: undefined, bottom: undefined, right: undefined });

    const bottom = cellData.bottom ? "bottom " + cellData.bottom : "";
    const right = cellData.right ? "right " + cellData.right : "";

    return (
        <div id={id} className={"board-cell " + className}>
            <span className="board-text">{cellData.value}</span>
            <span className={"board-underline " + bottom} />
            <span className={"board-underline " + right} />
        </div>
    );
}
