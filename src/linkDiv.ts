import { createPath, createMainPath, createLinkSvg } from './utils/svg'
import { findEle } from './utils/dom'
import { SIDE, GAP, TURNPOINT_R, MAIN_NODE_HORIZONTAL_GAP, MAIN_NODE_VERTICAL_GAP } from './const'

/**
 * Link nodes with svg,
 * only link specific node if `mainNode` is present
 *
 * procedure:
 * 1. calculate position of main nodes
 * 2. layout main node, generate main link
 * 3. generate links inside main node
 * 4. generate custom link
 * @param {object} mainNode process the specific main node only
 */
export default function linkDiv(mainNode: Wrapper) {
  const mainNodeHorizontalGap = this.mainNodeHorizontalGap || MAIN_NODE_HORIZONTAL_GAP
  const mainNodeVerticalGap = this.mainNodeVerticalGap || MAIN_NODE_VERTICAL_GAP
  console.time('linkDiv')
  const root = this.root
  root.style.cssText = `top:${10000 - root.offsetHeight / 2}px;left:${10000 - root.offsetWidth / 2}px;`
  const mainNodeList = this.mainNodes.children
  this.lines.innerHTML = ''

  // 1. calculate position of main nodes
  let totalHeight = 0
  let shortSide: string // l or r
  let shortSideGap = 0 // balance heigt of two side
  let currentOffsetL = 0 // left side total offset
  let currentOffsetR = 0 // right side total offset
  let totalHeightL = 0
  let totalHeightR = 0
  let base: number // start offset

  let lhsNodes = 0
  let rhsNodes = 0

  for (let i = 0; i < mainNodeList.length; i++) {
    const el = mainNodeList[i]
    if (el.className === 'lhs') {
      lhsNodes += 1
    } else {
      rhsNodes += 1
    }
  }

  if (this.direction === SIDE) {
    let countL = 0
    let countR = 0
    let totalHeightLWithoutGap = 0
    let totalHeightRWithoutGap = 0
    for (let i = 0; i < mainNodeList.length; i++) {
      const el = mainNodeList[i]
      if (el.className === 'lhs') {
        totalHeightL += el.offsetHeight + mainNodeVerticalGap
        totalHeightLWithoutGap += el.offsetHeight
        countL += 1
      } else {
        totalHeightR += el.offsetHeight + mainNodeVerticalGap
        totalHeightRWithoutGap += el.offsetHeight
        countR += 1
      }
    }

    if (totalHeightL > totalHeightR) {
      base = 10000 - Math.max(totalHeightL) / 2
      shortSide = 'r'
      // fix the alignment issues
      if (rhsNodes % 2) {
        totalHeightL = totalHeightL - mainNodeVerticalGap
      }
      shortSideGap = (totalHeightL - totalHeightRWithoutGap) / (countR - 1)
    } else {
      base = 10000 - Math.max(totalHeightR) / 2
      shortSide = 'l'
      // fix the alignment issues
      if (lhsNodes % 2) {
        totalHeightR = totalHeightR - mainNodeVerticalGap
      }
      shortSideGap = (totalHeightR - totalHeightLWithoutGap) / (countL - 1)
    }
  } else {
    for (let i = 0; i < mainNodeList.length; i++) {
      const el = mainNodeList[i]
      totalHeight += el.offsetHeight + mainNodeVerticalGap
    }
    base = 10000 - totalHeight / 2
  }

  // 2. layout main node, generate main link
  const alignRight = 10000 - root.offsetWidth / 2 - mainNodeHorizontalGap
  const alignLeft = 10000 + root.offsetWidth / 2 + mainNodeHorizontalGap
  for (let i = 0; i < mainNodeList.length; i++) {
    let x1 = 10000
    const y1 = 10000
    let x2, y2
    const el = mainNodeList[i]
    const palette = this.theme.palette
    const branchColor = el.querySelector('me-tpc').nodeObj.branchColor || palette[i % palette.length]
    const elOffsetH = el.offsetHeight
    if (el.className === 'lhs') {
      // console.warn('base + currentOffsetL', base, currentOffsetL)
      el.style.top = base + currentOffsetL + 'px'
      el.style.left = alignRight - el.offsetWidth + 'px'
      x2 = alignRight - GAP
      y2 = base + currentOffsetL + elOffsetH / 2

      // console.warn('base + currentOffsetL + elOffsetH', elOffsetH, shortSide)

      if (shortSide === 'l') {
        currentOffsetL += elOffsetH + shortSideGap
      } else {
        currentOffsetL += elOffsetH + mainNodeVerticalGap
      }
    } else {
      console.warn('base + currentOffsetR', base, currentOffsetR, el.offsetHeight)
      el.style.top = base + currentOffsetR + 'px'
      el.style.left = alignLeft + 'px'
      x2 = alignLeft + GAP
      y2 = base + currentOffsetR + elOffsetH / 2

      console.warn('base + currentOffsetR + elOffsetH', elOffsetH, shortSide, shortSideGap)

      if (shortSide === 'r') {
        currentOffsetR += elOffsetH + shortSideGap
      } else {
        currentOffsetR += elOffsetH + shortSideGap
      }
    }

    let mainPath = ''
    if (this.mainLinkStyle === 2) {
      if (this.direction === SIDE) {
        if (el.className === 'lhs') {
          x1 = 10000 - root.offsetWidth / 6
        } else {
          x1 = 10000 + root.offsetWidth / 6
        }
      }
      mainPath = generateMainLine2({ x1, y1, x2, y2 })
    } else {
      const pct = Math.abs(y2 - 10000) / (10000 - base)
      if (el.className === 'lhs') {
        x1 = 10000 - root.offsetWidth / 10 - (1 - pct) * 0.25 * (root.offsetWidth / 2)
      } else {
        x1 = 10000 + root.offsetWidth / 10 + (1 - pct) * 0.25 * (root.offsetWidth / 2)
      }

      const points = {
        x1,
        y1,
        x2,
        y2,
      }

      if (lhsNodes === 1 && el.className === 'lhs') {
        Object.assign(points, {
          y2: y1,
        })

        const top = root.offsetTop + (root.offsetHeight - el.offsetHeight) / 2

        Object.assign(el.style, {
          top: top + 'px',
        })
      }

      if (rhsNodes === 1 && el.className === 'rhs') {
        Object.assign(points, {
          y2: y1,
        })

        const top = root.offsetTop + (root.offsetHeight - el.offsetHeight) / 2

        Object.assign(el.style, {
          top: top + 'px',
        })
      }

      mainPath = generateMainLine1(points)
    }

    this.lines.appendChild(createMainPath(mainPath, branchColor))

    // set position of expander
    const expander = el.children[0].children[1]
    if (expander) {
      expander.style.top = (expander.parentNode.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (el.className === 'lhs') {
        expander.style.left = -10 - GAP + 'px'
      } else {
        expander.style.right = -10 - GAP + 'px'
      }
    }

    // 3. generate link inside main node
    if (mainNode && mainNode !== mainNodeList[i]) {
      continue
    }

    if (el.childElementCount) {
      const svg = createLinkSvg('subLines')
      // svg tag name is lower case
      if (el.lastChild.tagName === 'svg') el.lastChild.remove()
      el.appendChild(svg)
      const parent = el.children[0]
      const children = el.children[1].children
      const path = traverseChildren(children, parent, true)
      svg.appendChild(createPath(path, branchColor))
    }
  }

  // 4. generate custom link
  this.linkSvgGroup.innerHTML = ''
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    if (typeof link.from === 'string') {
      this.createLink(findEle(link.from), findEle(link.to), true, link)
    } else {
      this.createLink(findEle(link.from.nodeObj.id), findEle(link.to.nodeObj.id), true, link)
    }
  }
  console.timeEnd('linkDiv')
}

// core function of generate subLines
const traverseChildren = function (children, parent, isFirst?: boolean, delta?: number) {
  let path = ''
  const pT = parent.offsetTop
  const pL = parent.offsetLeft
  const pW = parent.offsetWidth + (delta || 0)
  const pH = parent.offsetHeight

  let maxWidth = 0

  for (let i = 0; i < children.length; i++) {
    const child = children[i] as Wrapper
    const childT = child.children[0] as Parent
    const cW = childT.offsetWidth
    if (cW > maxWidth) {
      maxWidth = cW
    }
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i] as Wrapper
    const childT = child.children[0] as Parent
    const cT = childT.offsetTop
    const cL = childT.offsetLeft
    const cW = maxWidth + (delta || 0)
    const cH = childT.offsetHeight
    const direction = child.offsetParent.className

    path += generateSubLine2({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst })

    const expander = childT.children[1] as Expander
    if (expander) {
      expander.style.bottom = -(expander.offsetHeight / 2) + 'px'
      if (direction === 'lhs') {
        expander.style.left = 0 + 'px'
      } else if (direction === 'rhs') {
        expander.style.left = maxWidth + 'px'
      }
      // this property is added in the layout phase
      if (!expander.expanded) continue
    } else {
      // expander not exist
      continue
    }

    if (child.children[1]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Object.assign(child.children[1].style, {
        marginLeft: `${maxWidth - childT.offsetWidth}px`,
      })
    }

    const nextChildren = child.children[1].children
    if (nextChildren.length > 0) {
      path += traverseChildren(nextChildren, childT, false, maxWidth - childT.offsetWidth)
    }
  }
  return path
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands
function generateMainLine2({ x1, y1, x2, y2 }) {
  return `M ${x1} 10000 V ${y2 > y1 ? y2 - 20 : y2 + 20} C ${x1} ${y2} ${x1} ${y2} ${x2 > x1 ? x1 + 20 : x1 - 20} ${y2} H ${x2}`
}

function generateMainLine1({ x1, y1, x2, y2 }) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

function generateSubLine({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }) {
  let y1: number
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1: number, x2: number, xMiddle: number
  if (direction === 'lhs') {
    x1 = pL + GAP
    x2 = cL
    xMiddle = cL + cW
  } else if (direction === 'rhs') {
    x1 = pL + pW - GAP
    x2 = cL + cW
    xMiddle = cL
  }

  if (y2 < y1 + 50 && y2 > y1 - 50) {
    // draw straight line if the distance is between +-50
    return `M ${x1} ${y1} H ${xMiddle} V ${y2} H ${x2}`
  } else if (y2 >= y1) {
    // child bottom lower than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${y2 - TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 1 : 0} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  } else {
    // child bottom higher than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${y2 + TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 0 : 1} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  }
}

function generateSubLine2({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }) {
  let y1: number
  let end: number
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1: number, x2: number, xMid: number
  if (direction === 'lhs') {
    xMid = pL
    x1 = xMid + GAP
    x2 = xMid - GAP
    end = cL + GAP
  } else if (direction === 'rhs') {
    xMid = pL + pW
    x1 = xMid - GAP
    x2 = xMid + GAP
    end = cL + cW - GAP
  }
  return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid} ${y2} ${x2} ${y2} H ${end}`
}

function generateSubLine3({ x1, y1, x2, y2, xMiddle }) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${xMiddle} ${y2} H ${x2}`
}
