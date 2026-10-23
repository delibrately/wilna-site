+++
title = '机械臂'
description = '研究机械臂与视觉传感器的联合标定，为视觉引导操作提供空间关系基础。'
draft = false
type = 'research'
layout = 'research'
parent_area = 'research/physical-ai'
img = 'research/robotic-arms-paper.png'
intro = """机械臂将感知结果转化为实际操作，准确的机器人坐标系与相机坐标系关系是视觉引导任务的重要基础。"""
detailedIntro = [
"手眼标定用于估计相机与机械臂末端执行器之间的变换关系；机器人世界标定还涉及机器人基座、视觉传感器和外部参考坐标系。测量噪声、观测质量和不同传感器的误差会影响联合参数估计。",
"相关研究可从标定数据采集、坐标变换建模、误差分析和参数优化展开，并评估标定精度对后续定位与操作的影响。页面所列论文研究了手眼与机器人世界参数的联合优化。"
]
+++
