import { Table, Row, Col, User, Text } from "@nextui-org/react";

function PlayerList(props) {
  const squad = props.squad;
  // console.log(squad);
  const columns = [
    { name: "NAME", uid: "name" },
    { name: "STYLE", uid: "style" },
    // { name: "BOWLING STYLE", uid: "bowlingStyle" },
  ];

  const renderCell = (user, columnKey) => {
    const cellValue = user[columnKey];
    // console.log('switch ck:'+columnKey,'value: '+ user[columnKey])
    switch (columnKey) {
      case "name":
        return (
          <User
            squared
            src={`http://i.cricketcb.com/stats/img/faceImages/${user.id}.jpg`}
            name={cellValue}
            css={{ p: 0 }}
          >
            {user.role}
          </User>
        );

      default:
        return (
          <Col>
            <Row>
              <Text b size={13} css={{ tt: "capitalize", color: "$accents7" }}>
                {user.battingStyle}
              </Text>
            </Row>
            <Row>
              <Text b size={13} css={{ tt: "capitalize", color: "$accents7" }}>
                {user.bowlingStyle}
              </Text>
            </Row>
          </Col>
        );
    }
  };

  return (
    <div>
      <Table
        // striped
        aria-label="Example table with custom cells"
        css={{
          height: "auto",
          minWidth: "100%",
        }}
        selectionMode="multiple"
      >
        <Table.Header columns={columns}>
          {(column) => (
            <Table.Column
              key={column.uid}
              hideHeader={column.uid === "actions"}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </Table.Column>
          )}
        </Table.Header>
        <Table.Body items={squad}>
          {squad.map((player) =>
            player.isHeader ? (
              <Table.Row key={player.name} css={{ background: "#8A8A8A" }}>
                <Table.Cell>{player.name}</Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : (
              <Table.Row key={player.name}>
                {(columnKey) => (
                  <Table.Cell key={columnKey}>
                    {renderCell(player, columnKey)}
                  </Table.Cell>
                )}
              </Table.Row>
            )
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

export default PlayerList;
