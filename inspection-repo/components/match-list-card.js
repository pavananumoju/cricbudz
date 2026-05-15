import { Spacer, Card, Text } from "@nextui-org/react";
import { getDate_dd_month_yyyy, getDate_wwwddmmyyyy } from "./utils/date-utils";
import { currentMatchDay } from "./utils/mock-utils";
import MatchListCardRow from "./match-list-card-row";
import { useRouter } from "next/router";

function MatchListCard(props) {
  const { matchData } = props;
  const router = useRouter();

  const mdm = matchData.matchDetailsMap;

  function handleMatchClick() {
    const rawDate_wwwddmmyyyy = matchData.matchDetailsMap.key;
    const dateObj = new Date(rawDate_wwwddmmyyyy);
    const date_dd_month_yyyy = getDate_dd_month_yyyy(dateObj);
    router.push("/matches/todays/" + date_dd_month_yyyy);
  }

  const matchesData =
    mdm != undefined
      ? {
          date: mdm.key,
          match_1_data: mdm.match[0],
          match_2_data: mdm.match[1] && mdm.match[1],
        }
      : null;

  var today = getDate_wwwddmmyyyy(new Date());

  //mock date for development
  today = currentMatchDay;

  return (
    <>
      {matchesData && (
        <>
          <Card
            onClick={handleMatchClick}
            isPressable
            isHoverable
            // css={{ borderColor: matchesData.date === today ? "yellow" : "" }}
            // variant="bordered"
          >
            <Spacer y={0.5} />
            <Text size={15} b color="#ff4ecd">
              {matchesData.date}
            </Text>
            <Spacer y={0.5} />
            <MatchListCardRow
              match={"m1"}
              matchesData={matchesData}
              today={today}
              match_data={matchesData.match_1_data}
            />
            <Spacer y={0.5} />
            {matchesData.match_2_data && (
              <>
                <MatchListCardRow
                  match={"m2"}
                  matchesData={matchesData}
                  today={today}
                  match_data={matchesData.match_2_data}
                />
                <Spacer y={0.5} />
              </>
            )}
          </Card>
          <Spacer y={1} />
        </>
      )}
    </>
  );
}

export default MatchListCard;
