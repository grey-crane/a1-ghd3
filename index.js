console.log("d3 version", d3.version); // test that d3 loaded

const circleOfFifths = ["C", "G", "D", "A", "E", "Cb/B", "Gb/F#", "Db/C#", "Ab", "Eb", "Bb", "F"];

const accidentals = (root) => {
  const orderOfSharps = ["F", "C", "G", "D", "A", "E", "B"];
  const orderByNote = (key) => { // returns function that sorts accidentals
    const notes = ["C", "D", "E", "F", "G", "A", "B"];
    const start = notes.indexOf(key[0]);
    const rank = (note) => (notes.indexOf(note[0]) - start + 7) % 7;
    return (a, b) => rank(a) - rank(b);
  };

  let lines = ["Accidentals"]
  const index = circleOfFifths.indexOf(root);
  if (index < 0) return [];

  if (index >= 5) { // key written with flats
    lines.push([...orderOfSharps].reverse().slice(0, 12 - index)
      .sort(orderByNote(root))
      .map((n) => n + "b")
      .join(" "));
  }
  if (index <= 7) { // key writtne with sharps
    lines.push(orderOfSharps.slice(0, index)
      .sort(orderByNote(root.slice(3)))
      .map((n) => n + "#")
      .join(" "));
  }

  return lines;
};


// Declare the chart dimensions and margins.
const chart = (() => {
  const width = 1600;
  const height = 1200;
  const sideTotal = 12;

  const innerR = 300;
  const outerR = 500;
  const border = {
    x: -width/2 + 50,
    y: -height/2 + 50,
    width: width - 100,
    height: height - 100,
  };

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    // center origin in viewBox
    .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`);

  // border 
  svg.append("rect")
    .attr("id", "border")
    .attr("x", border.x)
    .attr("y", border.y)
    .attr("width", border.width)
    .attr("height", border.height);

  const sectors = svg.append("g").attr("id", "sectors");
  const labels = svg.append("g").attr("id", "labels"); // keeps labels always visible
  const center = svg.append("g").attr("class", "shape-lines");
  const accidentalsLabel = labels.append("g").attr("id", "accidentals");

  const updateCenter = (root = null) => {
    let strings = [];
    if (root === null) {
      strings = ["Circle", "Of", "Fifths"];
    } else {
      strings = accidentals(root);
    }
    accidentalsLabel
      .selectAll("text")
      .data(strings)
      .join("text")
      .attr("class", "label text")
      .attr("y", (d, i) => i * 40 - 40) // for multi line items
      .text((d) => d);
  };

  const section = d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .angle((d) => d.angle)
    .radius((d) => d.radius);


  const sectionBox = (sideN, inR, outR) => {
      // offset puts first item at top of circle
    const sideToAngle = (sideN) => {
      return (sideN / sideTotal) * 2 * Math.PI - (Math.PI / 12);
    };
    const aStart = sideToAngle(sideN);
    const aEnd = sideToAngle(sideN + 1);

    return {
      points: [
        { angle: aStart, radius: inR },
        { angle: aEnd, radius: inR },
        { angle: aEnd, radius: outR },
        { angle: aStart, radius: outR },
      ],
      // rotates label 90 deg ccw to align label with sector
      center: {
        x: ((inR + outR) / 2) * Math.sin((aStart + aEnd) / 2),
        y: (-(inR + outR) / 2) * Math.cos((aStart + aEnd) / 2),
      },
    };
  };

  const color = d3.scaleSequential([0, sideTotal], d3.interpolateRainbow);
  let clicked = null;

  circleOfFifths.forEach((key, i) => {
    const sector = sectionBox(i, innerR, outerR);

    sectors
      .append("path")
      .attr("d", section(sector.points))
      .attr("class", "shape-lines")
      .attr("fill", color(i))
      .attr("stroke", "black")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "white").raise();
        updateCenter(key);
      })
      .on("mouseleave", function (event, d) {
        if (clicked) {
          d3.select(clicked.elem).raise();
          updateCenter(clicked.key);
          if (this === clicked.elem) return;
        } else {
          updateCenter();
        }
        d3.select(this).attr("stroke", "black");
      })
      .on("click", function (event, d) {
        if (clicked) {
          d3.select(clicked.elem).attr("stroke", "black").lower();
          updateCenter();
          if (clicked.elem === this) {
            clicked = null;
            console.log(null);
            return;
          }
        }
        d3.select(this).attr("stroke", "white").raise();
        updateCenter(key);
        clicked = {elem: this, key: key};
        console.log(clicked);
      });

    labels
      .append("text")
      .text(key)
      .attr("class", "label key")
      .attr("x", sector.center.x)
      .attr("y", sector.center.y);
 });
   updateCenter();

  return svg.node();
})();

document.getElementById("container").append(chart);
