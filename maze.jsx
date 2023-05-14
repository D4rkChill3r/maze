oldhmu = app.activeDocument.viewPreferences.horizontalMeasurementUnits;
oldvmu = app.activeDocument.viewPreferences.verticalMeasurementUnits;

// Changed to points, slightly smaller mazes.
app.activeDocument.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
app.activeDocument.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;

drawInsideSomething = false;

if (app.selection.length == 1 && app.selection[0].hasOwnProperty("paths"))
{
	drawInsideSomething = true;

	if (app.selection[0].locked)
		app.selection[0] = app.selection[0].duplicate();
//	app.selection[0].paths.everyItem().pathPoints.everyItem().pointType = PointType.LINE_TYPE;

	for (pp=0; pp<app.selection[0].paths.length; pp++)
	{
		a_path = app.selection[0].paths[pp].entirePath;
		newpath = new Array();
		changed = false;
		pt = 0;
		while (pt<a_path.length)
		{
			if (a_path[pt].length == 3)
			{
				changed = true;
				var alist = new Array();
				if (pt == a_path.length-1)
					nextpt = 0;
				else
					nextpt = pt+1;
				if (a_path[nextpt].length == 3)
				{
					curve4 (a_path[pt][1][0],a_path[pt][1][1],
							a_path[pt][2][0],a_path[pt][2][1],
							a_path[nextpt][0][0],a_path[nextpt][0][1],
							a_path[nextpt][1][0],a_path[nextpt][1][1],
						4, alist);
					newpath = newpath.concat (alist);
				} else
				{
					curve4 (a_path[pt][1][0],a_path[pt][1][1],
							a_path[pt][0][0],a_path[pt][0][1],
							a_path[pt][2][0],a_path[pt][2][1],
							a_path[nextpt][0],a_path[nextpt][1],
						4, alist);
					newpath = newpath.concat (alist);
				}
			} else
			{
				newpath.push (a_path[pt]);
			}
			pt++;
		}
		if (changed)
			app.selection[0].paths[pp].entirePath = newpath;
	}

	xoff = app.selection[0].geometricBounds[1];
	yoff = app.selection[0].geometricBounds[0];
	rectwidth = app.selection[0].geometricBounds[3] - app.selection[0].geometricBounds[1];
	rectheight = app.selection[0].geometricBounds[2] - app.selection[0].geometricBounds[0];
	mazeWidth = Math.floor(rectwidth/8);
	mazeHeight = Math.floor(rectheight/8);
	
	xoff += (rectwidth-8*mazeWidth)/2;
	yoff += (rectheight-8*mazeHeight)/2;
} else
{
	mazeDlg = app.dialogs.add ({name:"Maze Size",canCancel:true});
	with (mazeDlg)
	{
		with (dialogColumns.add())
		{
			with (dialogRows.add())
				staticTexts.add ({staticLabel:"Width"});
			with (dialogRows.add())
				wBox = integerEditboxes.add({editContents:"20"});
			with (dialogRows.add())
				staticTexts.add ({staticLabel:"Height"});
			with (dialogRows.add())
				hBox = integerEditboxes.add({editContents:"20"});
		}
	}
	if (!mazeDlg.show())
	{
		mazeDlg.destroy();
		app.activeDocument.viewPreferences.horizontalMeasurementUnits = oldhmu;
		app.activeDocument.viewPreferences.verticalMeasurementUnits = oldvmu;
		exit(0);
	}
	mazeWidth = wBox.editValue;
	mazeHeight = hBox.editValue;
	xoff = (app.activeDocument.documentPreferences.pageWidth - 8*mazeWidth)/2;
	yoff = (app.activeDocument.documentPreferences.pageHeight - 8*mazeHeight)/2;
}

if (mazeWidth < 2 || mazeHeight < 2)
{
	alert ("This maze is too small -- "+mazeWidth+" x "+mazeHeight);
	app.activeDocument.viewPreferences.horizontalMeasurementUnits = oldhmu;
	app.activeDocument.viewPreferences.verticalMeasurementUnits = oldvmu;
	exit(0);
}

maze = new Array(mazeHeight+1);

if (drawInsideSomething)
{
	triedAgain = false;

	for (y=0; y<mazeHeight+1; y++)
	{
		maze[y] = new Array(mazeWidth+1);
		for (x=0; x<=mazeWidth; x++)
		{
			maze[y][x] = -1;
		}
	}
	

	while (1)
	{
		for (p=0; p<app.selection[0].paths.length; p++)
		{
			a_path = app.selection[0].paths[p].entirePath;

			a = getWinding ( a_path );

			winding = (a < 0) ? true : false;
		//	alert ("path: "+p+" = "+winding+"; "+a_path.join("  "));
			for (y=0; y<mazeHeight; y++)
			{
				for (x=0; x<mazeWidth; x++)
				{
					pt = [ xoff+8*x+4, yoff+8*y+4 ];
					if (pointInside (pt, a_path))
					{
						maze[y][x] = winding ? -1 : 0;
					//	if (seePathWinding)
					//		app.activeDocument.rectangles.add({geometricBounds:[yoff+8*y+1, xoff+8*x+1, yoff+8*(y+1)-1, xoff+8*(x+1)-1 ], fillColor:blackSwatch, fillTint:winding ? 10 : 50 } );
					}
				}
			}
		}
		foundAny = false;
		for (y=0; y<mazeHeight; y++)
		{
			for (x=0; x<mazeWidth; x++)
			{
				if (!maze[y][x])
				{
					foundAny = true;
					break;
				}
			}
		}
		if (foundAny)
			break;
		if (triedAgain)
		{
			alert ("No valid paths found! Check the path winding order...");
			exit(0);
		}
	//	alert ("Hmmm. Reversing path and trying again.");
		triedAgain = true;
		app.selection[0].paths.everyItem().reverse();
	}
} else
{
	for (y=0; y<mazeHeight+1; y++)
	{
		maze[y] = new Array(mazeWidth+1);
		for (x=0; x<mazeWidth+1; x++)
		{
			maze[y][x] = 0;
		}
	}
}


/* for (y=0; y<mazeHeight; y++)
{
	for (x=0; x<mazeWidth; x++)
	{
		if (maze[y][x] == 0)
			app.activeDocument.rectangles.add({geometricBounds:[yoff+8*y+1, xoff+8*x+1, yoff+8*(y+1)-1, xoff+8*(x+1)-1 ], fillColor:blackSwatch, fillTint:100 } );
	}
}

exit(0); */

do
{
	posx = Math.floor(Math.random()*mazeWidth);
	posy = Math.floor(Math.random()*mazeHeight);
	if (maze[posy][posx] == 0)
		break;
} while (1);

// maze[posy][posx] = 15;

validcells = [];

while (1)
{
	validdir = [];
	
//	can we go up?
	if (posy > 0 && maze[posy-1][posx] == 0)
		validdir.push (1);
//	can we go right?
	if (posx < mazeWidth-1 && maze[posy][posx+1] == 0)
		validdir.push (2);
//	can we go down?
	if (posy < mazeHeight-1 && maze[posy+1][posx] == 0)
		validdir.push (4);
//	can we go left?
	if (posx > 0 && maze[posy][posx-1] == 0)
		validdir.push (8);
	if (validdir.length == 0)
	{
		if (validcells.length == 0)
			break;
		x = validcells.pop();
		posx = x[0];
		posy = x[1];
		continue;
	}
	if (validdir.length == 1)
		newdir = validdir[0];
	else
	{
		newdir = validdir[Math.floor(Math.random()*validdir.length)];
		validcells.push ([posx,posy]);
	}
	maze[posy][posx] |= newdir;
	switch (newdir)
	{
	//	up
		case 1:
		//	app.activeDocument.rectangles.add({geometricBounds:[yoff+8*posy-7, xoff+8*posx+1, yoff+8*(posy+1)-1, xoff+8*(posx+1)-1 ], fillColor:blackSwatch, fillTint:10 } );
			posy--;
			maze[posy][posx] |= 4;
			break;
	// right
		case 2:
		//	app.activeDocument.rectangles.add({geometricBounds:[yoff+8*posy+1, xoff+8*posx+1, yoff+8*(posy+1)-1, xoff+8*(posx+1)+7 ], fillColor:blackSwatch, fillTint:10 } );
			posx++;
			maze[posy][posx] |= 8;
			break;
	//	down
		case 4:
		//	app.activeDocument.rectangles.add({geometricBounds:[yoff+8*posy+1, xoff+8*posx+1, yoff+8*(posy+1)+7, xoff+8*(posx+1)-1 ], fillColor:blackSwatch, fillTint:10 } );
			posy++;
			maze[posy][posx] |= 1;
			break;
	//	left
		case 8:
		//	app.activeDocument.rectangles.add({geometricBounds:[yoff+8*posy+1, xoff+8*posx-7, yoff+8*(posy+1)-1, xoff+8*(posx+1)-1 ], fillColor:blackSwatch, fillTint:10 } );
			posx--;
			maze[posy][posx] |= 2;
			break;
	}
}


for (x=0; x<mazeWidth; x++)
	maze[mazeHeight][x] = -1;

for (y=0; y<mazeHeight; y++)
{
	maze[y].splice(0,0,-1);
	for (x=0; x<=mazeWidth; x++)
	{
		if (maze[y][x] != -1)
			maze[y][x] = (maze[y][x] & 3) ^ 3;
	}
}

for (y=mazeHeight; y>=0; y--)
{
	for (x=0; x<=mazeWidth; x++)
	{
		if (maze[y][x] == -1)
		{
			if (y > 0 && maze[y-1][x] != -1)
			{
				if (x < mazeWidth-1 && maze[y][x+1] != -1)
					maze[y][x] = 3;
				else
					maze[y][x] = 1;
			} else
			{
				if (x < mazeWidth-1 && maze[y][x+1] != -1)
					maze[y][x] = 2;
				else
					maze[y][x] = 0;
			}
		}
	}
}

for (y=0; y<=mazeHeight; y++)
{
	for (x=0; x<=mazeWidth; x++)
	{
		if (x > 0 && (maze[y][x] & 1))
			maze[y][x-1] |= 4;
		if (y < mazeHeight && maze[y][x] & 2)
			maze[y+1][x] |= 8;
	}
}

/* for (y=0; y<=mazeHeight; y++)
{
	for (x=0; x<=mazeWidth; x++)
	{
		f = app.activeDocument.textFrames.add({geometricBounds:[yoff+8*y-4, xoff+8*x-4, yoff+8*y+4, xoff+8*x+4 ]} );
		f.insertionPoints[-1].properties = ( {contents:String(maze[y][x]), pointSize:4, justification:Justification.CENTER_ALIGN} );
		f.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
	}
}
*/

// Now all corners are marked with direction codes
// 1=left
// 2=down
// 4=right
// 8=up

y = 0;
while (y < mazeHeight)
{
	x = 0;
	while (x < mazeWidth && maze[y][x] == 0)
		x++;
	if (x < mazeWidth)
		break;
	y++;
}
while (!(maze[y][x] & 4))
	x++;

//app.activeDocument.rectangles.add({geometricBounds:[yoff+8*y+1, xoff+8*x+1, yoff+8*(y+1)-1, xoff+8*(x+1)-1 ], fillColor:blackSwatch, fillTint:60 } );
// app.activeDocument.ovals.add({geometricBounds:[yoff+8*y-1, xoff+8*x-1, yoff+8*y+1, xoff+8*x+1 ], fillColor:blackSwatch, fillTint:80 } );

startx = x;
starty = y;

todo = [];
dir = 4;

var xfordir = [ 0,-1,0,0,1,0,0,0,0 ];
var yfordir = [ 0,0,1,0,0,0,0,0,-1 ];

theLine = null;
blackSwatch = app.activeDocument.swatches.item("Black");
noneSwatch = app.activeDocument.swatches.item("None");

// walk clockwise around the edge
p = [ [xoff+8*x, yoff+8*y] ];
do
{
	while (maze[y][x] & dir)
	{
		maze[y][x] ^= dir;
		if (maze[y][x])
		{
		//	app.activeDocument.ovals.add({geometricBounds:[yoff+8*y-2, xoff+8*x-2, yoff+8*y+2, xoff+8*x+2 ], fillColor:app.activeDocument.swatches[4], fillTint:100 } );
			todo.push ([x,y]);
		}
		x += xfordir[dir];
		y += yfordir[dir];
		switch (dir)
		{
			case 1: maze[y][x] ^= 4; break;
			case 2: maze[y][x] ^= 8; break;
			case 4: maze[y][x] ^= 1; break;
			case 8: maze[y][x] ^= 2; break;
		}
		nextdir = dir<<1;
		if (nextdir == 16)
			nextdir = 1;
		if (maze[y][x] & nextdir)
		{
			p.push ([xoff+8*x, yoff+8*y] );
			dir = nextdir;
		}
	}
	p.push ([xoff+8*x, yoff+8*y] );
	if (!(maze[y][x]))
	{
		if (p.length > 1)
		{
			if (p[0][0] == p[p.length-1][0] && p[0][1] == p[p.length-1][1])
			{
				l = app.activeDocument.graphicLines.add({strokeColor:blackSwatch,fillColor:noneSwatch});
				l.paths[0].entirePath = p;
					l.paths[0].pathType = PathType.CLOSED_PATH;
				theLine = null;
			} else
			{
				if (theLine == null)
				{
					theLine = app.activeDocument.graphicLines.add({strokeColor:blackSwatch,fillColor:noneSwatch});
					theLine.paths[0].entirePath = p;
				} else
				{
					theLine.paths.add({entirePath:p});
				}
			}
		}
		p = [];
		while (1)
		{
			if (todo.length == 0)
				break;
			d = todo.pop();
			x = d[0];
			y = d[1];
		//	app.activeDocument.ovals.add({geometricBounds:[yoff+8*y-2, xoff+8*x-2, yoff+8*y+2, xoff+8*x+2 ], fillColor:app.activeDocument.swatches[5], fillTint:100 } );
		//	alert ('todo: '+d);
			if (maze[y][x])
			{
				p.push ([xoff+8*x, yoff+8*y] );
				break;
			}
		}
	}
	if (!maze[y][x])
		break;
	if (maze[y][x] == 1 || maze[y][x] == 2 || maze[y][x] == 4 || maze[y][x] == 8)
		dir = maze[y][x];
	else
	{
		while (!(maze[y][x] & dir))
		{
			dir >>= 1;
			if (dir == 0)
				dir = 8;
		}
	}
	if (dir == 0)
		exit(0);
// app.activeDocument.ovals.add({geometricBounds:[yoff+8*y-1, xoff+8*x-1, yoff+8*y+1, xoff+8*x+1 ], fillColor:blackSwatch, fillTint:100 } );
} while (1);

if (p.length > 1)
{
	l = app.activeDocument.graphicLines.add({strokeColor:blackSwatch});
	l.paths[0].entirePath = p;
}
// alert (todo.length);

/* for (y=0; y<=mazeHeight; y++)
{
	for (x=0; x<=mazeWidth; x++)
	{
		f = app.activeDocument.textFrames.add({geometricBounds:[yoff+8*y-4, xoff+8*x-4, yoff+8*y+4, xoff+8*x+4 ]} );
		f.insertionPoints[-1].properties = ( {contents:String(maze[y][x]), pointSize:4, justification:Justification.CENTER_ALIGN} );
		f.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
	}
} */

app.activeDocument.viewPreferences.horizontalMeasurementUnits = oldhmu;
app.activeDocument.viewPreferences.verticalMeasurementUnits = oldvmu;


function getWinding (path)
{
//    Return area of a simple (ie. non-self-intersecting) polygon.
//    Will be negative for counterclockwise winding.
	var i,next;
    var accum = 0;
    for (i=0; i<path.length-1; i++)
    {
    	next = i+1;
        accum += path[next][0] * path[i][1] - path[i][0] * path[next][1];
    }
    next = 0;
	accum += path[next][0] * path[i][1] - path[i][0] * path[next][1];
    return accum / 2;
}

// As found on http://jsfromhell.com/math/is-point-in-poly
// No idea what this all means :-) [fortunately, I don't have to!]
function pointInside(pt, poly)
{
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
        && (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
        && (c = !c);

    return c;
}

function canGoDirection (maze, posx, posy, direction)
{
	var canGo = 0;

//	Can we go left?
	if (direction == 8)
	{
		if (maze[posy][posx] & 1)
			canGo |= 1;
	} else
	{
		if (maze[posy][posx] & (direction << 1))
			canGo |= (direction << 1);
	}
//	Can we continue forward?
	if (maze[posy][posx] & direction)
		canGo |= direction;
//	Can we turn right?
	if (direction == 1)
	{
		if (maze[posy][posx] & 8)
			canGo |=  8;
	} else
	{
		if (maze[posy][posx] & (direction >> 1))
			canGo |= (direction >> 1);
	}
	return canGo;
}

function getNextDirection (maze, posx, posy, direction)
{
	var i;

//	Turn left when possible
	if (direction == 8)
	{
		if (maze[posy][posx] & 1)
			return 1;
	} else
	{
		if (maze[posy][posx] & (direction << 1))
			return direction << 1;
	}
//	.. else go forward ..
	if (maze[posy][posx] & direction)
		return direction;
//	.. else turn right ..
	if (direction == 1)
	{
		if (maze[posy][posx] & 8)
			return 8;
	} else
	{
		if (maze[posy][posx] & (direction >> 1))
			return direction >> 1;
	}
//	We can only go back. Nah.
	return -1;
}

function getNextEdgeDirection (maze, posx, posy, direction)
{

//	Going right:
	if (direction == 2)
	{
	//	At the bottom: always
		if (posy == mazeHeight)
			return 2;
	//	At top left: always
		if (posx == 0)
			return 2;
	//	Can we turn down?
		if (!(maze[posy][posx-1] & 2))
			return 4;
	//	Can we go further on right?
		if (posx < mazeWidth && !(maze[posy][posx] & 1))
			return 2;
		return -1;
	}
	
//	Going down:
	if (direction == 4)
	{
	//	At far right: always
		if (posx == mazeWidth)
			return 4;
	//	At bottom right: always turn left
		if (posy == mazeHeight)
			return 8;
	//	Can we turn left?
		if (!(maze[posy][posx] & 4))
			return 8;
	//	Can we go further down?
		if (!(maze[posy][posx] & 4))
			return 4;
		return -1;
	}
	return -1;
}

// Code adapted from Maxim Shemanarev's AntiGrain
//	http://www.antigrain.com/research/bezier_interpolation/

function curve4(x1, y1,   //Anchor1
            x2, y2,   //Control1
            x3, y3,   //Control2
            x4, y4,   //Anchor2
            nSteps,   // Flattening value
         	pointList )
{
    var dx1 = x2 - x1;
    var dy1 = y2 - y1;
    var dx2 = x3 - x2;
    var dy2 = y3 - y2;
    var dx3 = x4 - x3;
    var dy3 = y4 - y3;

    var subdiv_step  = 1.0 / (nSteps + 1);
    var subdiv_step2 = subdiv_step*subdiv_step;
    var subdiv_step3 = subdiv_step*subdiv_step*subdiv_step;

    var pre1 = 3.0 * subdiv_step;
    var pre2 = 3.0 * subdiv_step2;
    var pre4 = 6.0 * subdiv_step2;
    var pre5 = 6.0 * subdiv_step3;

    var tmp1x = x1 - x2 * 2.0 + x3;
    var tmp1y = y1 - y2 * 2.0 + y3;

    var tmp2x = (x2 - x3)*3.0 - x1 + x4;
    var tmp2y = (y2 - y3)*3.0 - y1 + y4;

    var fx = x1;
    var fy = y1;

    var dfx = (x2 - x1)*pre1 + tmp1x*pre2 + tmp2x*subdiv_step3;
    var dfy = (y2 - y1)*pre1 + tmp1y*pre2 + tmp2y*subdiv_step3;

    var ddfx = tmp1x*pre4 + tmp2x*pre5;
    var ddfy = tmp1y*pre4 + tmp2y*pre5;

    var dddfx = tmp2x*pre5;
    var dddfy = tmp2y*pre5;

    var step = nSteps;

	pointList.push ([x1, y1]);	// Start Here
    while(step--)
    {
        fx   += dfx;
        fy   += dfy;
        dfx  += ddfx;
        dfy  += ddfy;
        ddfx += dddfx;
        ddfy += dddfy;
        pointList.push ([fx, fy]);
    }
    pointList.push ([x4, y4]); // Last step must go exactly to x4, y4
    return pointList;
}
