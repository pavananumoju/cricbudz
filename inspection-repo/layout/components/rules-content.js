import { Button, Container, Spacer, Table } from "@nextui-org/react";
import { useAuth } from "@/context/auth-context";
import { getDocRef, setDocToDB, setModifyDocToDB } from "@/components/utils/firebase-db-utils";
import { useRouter } from "next/router";

function RulesContent() {
  const { user } = useAuth();
  const router = useRouter();

  function handleTnCAccept() {
    if (user.uid) {
      console.log("TnC accepted by " + user.email);
      const docRef = getDocRef("Users", user.email);
      const data = { isTnCAccepted: true };
      setModifyDocToDB(docRef, data);
      router.push("/dashboard");
    } else {
      console.log("User is null");
    }
  }

  const columns = [
    {
      key: "sno",
      label: "SNO",
    },
    {
      key: "subject",
      label: "SUBJECT",
    },
    {
      key: "points",
      label: "POINTS",
    },
  ];

  const rows = [
    {
      sno: "1",
      subject: "1 Run",
      points: "1",
    },
    {
      sno: "2",
      subject: "1 Wicket",
      points: "10",
    },
    {
      sno: "3",
      subject: "1 Runout",
      points: "5",
    },
    {
      sno: "4",
      subject: "Direct Hit",
      points: "10",
    },
    {
      sno: "5",
      subject: "1 Catch",
      points: "5",
    },
    {
      sno: "6",
      subject: "1 Stumping",
      points: "5",
    },
    {
      sno: "7",
      subject: "1 Dot Bal",
      points: "1",
    },
    {
      sno: "8",
      subject: "Half Century",
      points: "5",
    },
    {
      sno: "9",
      subject: "Century",
      points: "10",
    },
    {
      sno: "10",
      subject: "5 Wicket Haul",
      points: "20",
    },
    {
      sno: "11",
      subject: "3 Wicket Haul",
      points: "10",
    },
    {
      sno: "12",
      subject: "Man of the Match",
      points: "10",
    },
  ];
  return (
    <Container justify="center" align="center">
      <Table
        lined
        striped
        hoverable
        //   selectionMode="multiple"
        //   headerLined
        //   shadow={false}
        aria-label="Example table with dynamic content"
        css={{
          height: "auto",
          minWidth: "100%",
        }}
      >
        <Table.Header columns={columns}>
          {(column) => (
            <Table.Column key={column.key}>{column.label}</Table.Column>
          )}
        </Table.Header>
        <Table.Body items={rows}>
          {(item) => (
            <Table.Row key={item.sno}>
              {(columnKey) => <Table.Cell>{item[columnKey]}</Table.Cell>}
            </Table.Row>
          )}
        </Table.Body>
      </Table>
      <Spacer y={1} />
      <Button onPress={handleTnCAccept}>Accept</Button>
    </Container>
  );
}

export default RulesContent;
