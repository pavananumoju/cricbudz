import { Card, Grid, Text, Link } from "@nextui-org/react";

function Player(props) {
  const { player } = props;
  return (
    <div className="flex justify-center mt-2">
      <Card
        isPressable
        isHoverable
        css={{ p: "$6", mw: "400px" }}
        variant="bordered"
      >
        <Card.Body>
          <Text>
            {player.name} - {player.role}
          </Text>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Player;
