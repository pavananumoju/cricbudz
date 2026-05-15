import { Button, Spacer, Text } from "@nextui-org/react";
import { getDate_dd_month_yyyy } from "../utils/date-utils";

function ResultDisplay(props) {
  const user = props.user;

  const todaysDate = getDate_dd_month_yyyy(new Date());

  return (
    <div>
      {user.isAdmin && (
        <>
          {todaysDate}
        </>
      )}
    </div>
  );
}

export default ResultDisplay;
