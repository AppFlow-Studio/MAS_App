import { View  } from 'react-native'
import React, { useEffect, useState } from 'react'
import {Canvas, useCanvasRef, Circle, Skia, Path, useFont, Text, Group, Line} from "@shopify/react-native-skia";
import { curveBasis, line, scaleLinear, scalePoint } from 'd3';
import { clamp, runOnJS, SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { format } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { Gesture, GestureDetector, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { getYForX, parse } from "react-native-redash"

type DonationGoalType = {
    date : string
    amount : number
    amountGiven : number
}
type DonationChartProp = {
    DONATION_GOAL : DonationGoalType[]
    CURR_DONATIONS : DonationGoalType[]
    CHART_HEIGHT : number
    CHART_WIDTH : number
    CHART_MARGIN : number
    setSelectedDate : ( selectedDate : string ) => void
    selectedValue : SharedValue<number>
    setNewDonationAnimation : ( newDonationAnimation : boolean ) => void
    newDonationAnimation : boolean
}

type AxisTextProp = {
    x : number,
    y : number,
    text : string,
}
const XAxisText = ( { x, y, text } : AxisTextProp) => {
    const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 10)
    if( !font ) return null
    const fontSize = font.measureText(text)
    return <Text text={text} x={x - fontSize.width / 2} y={y} font={font} color={'black'} />
}

const YAxisText = ({ x, y, text } : AxisTextProp) => {
    const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 10)
    if( !font ) return null
    const fontSize = font.measureText(text)
    if( fontSize.width < 26)
    return <Text text={text} x={x - fontSize.width * 2.5} y={y + fontSize.height / 10} font={font} color={'black'}  />
    else if( fontSize.width > 26 ){
        return <Text text={text} x={x - fontSize.width * 2.1} y={y + fontSize.height / 10} font={font} color={'black'}  />
    }
}

type CursorProp = {
    cx : SharedValue<number>
    cy : SharedValue<number>
    height : number
}
const Cursor = ( { cx, cy, height} : CursorProp ) => {
    const path = useDerivedValue(() => {
        const dottedLine = Skia.Path.Make().lineTo(0, height)
        dottedLine.dash(10, 10, 0)

        const matrix = Skia.Matrix()
        matrix.translate(cx.value, cy.value)
        dottedLine.transform(matrix)
        return dottedLine
    })
    return(
        <Group>
            <Path path={path} color={'black'} style={'stroke'} strokeWidth={2} strokeCap={'round'}/>
            <Circle cx={cx} cy={cy} r={9} style={'stroke'} strokeWidth={3} color={'black'} />
        </Group>
    )
}
type DonationEntry = {
    date: string;
    amount: number;
    amountGiven: number;
  };
  
  type AggregatedDonation = {
    year: number;
    amount: number;
    amountGiven: number;
  };
  
  type AggregatedDonationsByYear = {
    [year: number]: AggregatedDonation;
  };
  const aggregateDonationsByYear = (donations: DonationEntry[]) : AggregatedDonationsByYear => {
    return donations.reduce((acc: AggregatedDonationsByYear, donation: DonationEntry) => {
      const year = new Date(donation.date).getFullYear()
      if (!acc[year]) {
        acc[year] = { year, amount: 0, amountGiven: 0 };
      }
      acc[year].amount = Math.max(acc[year].amount, donation.amount);
      acc[year].amountGiven += donation.amountGiven;
      return acc;
    }, {});
  };

  const convertAggregatedToArray = (aggregated: AggregatedDonationsByYear): AggregatedDonation[] => {
    return Object.values(aggregated).sort((a, b) => a.year - b.year);
  };
  
const DonationChart = ( {DONATION_GOAL, CURR_DONATIONS,  CHART_HEIGHT, CHART_WIDTH, CHART_MARGIN, setSelectedDate, selectedValue, setNewDonationAnimation, newDonationAnimation } : DonationChartProp ) => {
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 12)
  const animationLine = useSharedValue(0)
  const cx = useSharedValue(0)
  const cy = useSharedValue(0)
  const totalDonations = CURR_DONATIONS.reduce( (acc, cur) => acc + cur.amountGiven , 0) 
  const [ showCursor, setShowCursor ] = useState(false)

  const aggregatedData = aggregateDonationsByYear(CURR_DONATIONS);
  const aggregatedDataArray = convertAggregatedToArray(aggregatedData);
    
  useEffect(() => {
    animationLine.value = withTiming(1, { duration : 2000 })
    selectedValue.value = withTiming(totalDonations, { duration : 2000 })
  }, []) 
  const xDomain = Array.from({ length: 2026 - 2017 + 1 }, (_, i) => (2017 + i).toString())
  const xRange = [CHART_MARGIN, CHART_WIDTH - CHART_MARGIN]

  const x = scalePoint().domain(xDomain).range(xRange).padding(0)

  const yDomain = [0,13000000]
  const yRange = [CHART_HEIGHT - CHART_MARGIN, CHART_MARGIN]
  
  const y = scaleLinear().domain(yDomain).range(yRange)

  const numYLabels = 10; // Number of labels you want on the Y-axis
  const yLabelStep = (yDomain[1] - yDomain[0]) / numYLabels;
  const yLabels = Array.from({ length : numYLabels + 1 }, (_, i) => yDomain[0] + i * yLabelStep);
  const CurvedLine = line<AggregatedDonation>()
  .x(d => x(d.year.toString())!)
  .y(d=> y(d.amount))
  .curve(curveBasis)(aggregatedDataArray)

  const LinePath = Skia.Path.MakeFromSVGString(CurvedLine!)

  const path = parse(LinePath!.toSVGString())

  const createLinePath = (data: DonationGoalType[], color: string) => {
    const CurvedLine = line<DonationGoalType>()
      .x(d => x(format( new Date(d.date), 'yyyy'))!)
      .y(d => y(d.amount))
      .curve(curveBasis)(data);

    const LinePath = Skia.Path.MakeFromSVGString(CurvedLine!);
    if (LinePath) {
      return <Path path={LinePath} style="stroke" strokeWidth={5} color={color} end={animationLine} />;
    } else {
      console.error('Error creating line path:', CurvedLine);
      return null;
    }
  };
  
  const createCurrDonLine = (data: AggregatedDonation[], color: string) => {
    const CurvedLine = line<AggregatedDonation>()
      .x(d => x(d.year.toString())!)
      .y(d => y(d.amount))
      .curve(curveBasis)(data);

    const LinePath = Skia.Path.MakeFromSVGString(CurvedLine!);
    if (LinePath) {
      return <Path path={LinePath} style="stroke" strokeWidth={5} color={color} end={animationLine} />;
    } else {
      console.error('Error creating line path:', CurvedLine);
      return null;
    }
  };

  const DonationGoalPath = createLinePath(DONATION_GOAL, '#0D509D');
  const CurrDonationsPath = createCurrDonLine(aggregatedDataArray, '#57BA47');
  const stepX = x.step()
  const maxClampValue = x(aggregatedDataArray[aggregatedDataArray.length - 1].year.toString())!

  const handleGestureEvent = (e : PanGestureHandlerEventPayload) => {
    'worklet'

    const index = Math.floor(e.absoluteX / stepX) - 1
    if( index < aggregatedDataArray.length )
    { 
        runOnJS(setSelectedDate)(aggregatedDataArray[index].year.toString())
        selectedValue.value = withTiming(aggregatedDataArray[index].amountGiven)
        const clampValue = clamp(
            index * stepX + CHART_MARGIN, 
            CHART_MARGIN, 
            maxClampValue)
            cx.value = clampValue
            cy.value = getYForX(path, Math.floor(clampValue))!
    }
    else{
      runOnJS(setSelectedDate)('Total')
      selectedValue.value = withTiming(totalDonations)
      const clampValue = clamp(
          (aggregatedDataArray.length - 1) * stepX + CHART_MARGIN, 
          CHART_MARGIN, 
          maxClampValue
          )
          cx.value = clampValue
          cy.value = getYForX(path, Math.floor(clampValue))!
      }
  }

  const pan = Gesture.Pan()
    .onTouchesDown(() => {
        runOnJS(setShowCursor)(true)
    })
    .onTouchesUp(() => {
        runOnJS(setShowCursor)(false)
        runOnJS(setSelectedDate)('Total')
        selectedValue.value = withTiming(totalDonations)
    })
    .onBegin(handleGestureEvent)
    .onChange(handleGestureEvent)


  return (
    <GestureDetector gesture={pan}>
    <Canvas style={{ width : CHART_WIDTH, height : CHART_HEIGHT,  backgroundColor : "white" }}>

    {DonationGoalPath}
    {CurrDonationsPath}   

     {/* X Axis Line */}
     <Line p1={{ x: CHART_MARGIN, y: CHART_HEIGHT - CHART_MARGIN }} p2={{ x: CHART_WIDTH - CHART_MARGIN, y: CHART_HEIGHT - CHART_MARGIN }} color="black" strokeWidth={2} />

{/* Y Axis Line */}
<Line p1={{ x: CHART_MARGIN, y: CHART_MARGIN }} p2={{ x: CHART_MARGIN, y: CHART_HEIGHT - CHART_MARGIN }} color="black" strokeWidth={2} />
    {xDomain.map( (item, index ) => (
            <XAxisText
            x={x(item)!} 
            y={CHART_HEIGHT}
            text={item}
            />
        )
    )}
    { yLabels.map((label, index) => (
          <YAxisText
            key={`y-axis-${index}`}
            x={CHART_MARGIN * 1.6} // Adjust as needed
            y={y(label)}
            text={`$${Math.round((label/1000000)).toString()}M`}
          />
        )) }   
    { showCursor && <Cursor cx={cx} cy={cy} height={CHART_HEIGHT}/> }
    </Canvas>
    </GestureDetector>
  )
}

export default DonationChart