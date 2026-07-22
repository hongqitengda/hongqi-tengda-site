'use strict';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = require('docx');

function t(v){ return String(v == null ? '' : v).trim(); }
function row(label, value){
  return new TableRow({ children:[
    new TableCell({ width:{size:28,type:WidthType.PERCENTAGE}, children:[new Paragraph({children:[new TextRun({text:label,bold:true})]})] }),
    new TableCell({ width:{size:72,type:WidthType.PERCENTAGE}, children:[new Paragraph(t(value) || '未填写')] })
  ]});
}
function titleFor(type){ return type==='ai'?'AI项目需求表':type==='calculation'?'计算模拟与数据分析需求表':'分析检测送样与技术需求表'; }
function fieldsFor(type, f){
  const common=[['项目编号',f.projectId||f.projectCode],['业务编号',f.demandNo||f.businessNo],['提交日期',f.submissionDate||new Date().toISOString().slice(0,10)],['项目名称',f.projectName],['联系人',f.name||f.contactName],['单位/学校',f.organization],['手机号/微信',f.contact||f.phone],['邮箱',f.email]];
  if(type==='ai') return common.concat([
    ['项目目标',f.projectGoal||f.description||f.detail],['现有数据情况',f.dataStatus],['数据类型与规模',f.dataTypeScale],['希望实现的功能',f.expectedFunction],['模型/系统类型',arr(f.selectedOptions)],['预期交付成果',f.deliverables],['是否需要部署',f.deploymentNeed],['补充说明',f.note]
  ]);
  if(type==='calculation') return common.concat([
    ['研究对象/体系',f.researchSystem||f.system||f.description],['结构与输入文件',f.structureInfo],['计算目的',f.calculationGoal],['计算内容',arr(f.selectedOptions)],['软件/方法要求',f.methodPreference],['主要参数',f.parameters],['预期输出',f.deliverables],['补充说明',f.note]
  ]);
  return common.concat([
    ['样品数量',f.sampleCount||f.sampleInfo?.count],['样品编号',f.sampleCodes],['样品状态',f.sampleState||f.sampleInfo?.state],['主要成分/化学式',f.composition||f.sampleInfo?.composition],['危险性',f.hazard||f.sampleInfo?.hazard],['测试参数/模式',arr(f.selectedOptions)],['数据分析服务',f.dataAnalysisNeed],['具体分析要求',f.analysisRequirement||f.description],['实验留言',f.note]
  ]);
}
function arr(v){ return Array.isArray(v)?v.join('、'):t(v); }
async function buildRequirementDocx(type, form){
  const title=titleFor(type);
  const rows=fieldsFor(type,form).map(([a,b])=>row(a,b));
  const doc=new Document({ sections:[{ properties:{}, children:[
    new Paragraph({alignment:AlignmentType.CENTER,heading:HeadingLevel.TITLE,children:[new TextRun({text:`上海红祺腾达信息技术有限公司`,bold:true,size:30})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:title,bold:true,size:34})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'HQTD Scientific',italics:true,color:'666666'})]}),
    new Paragraph(''),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows}),
    new Paragraph(''),
    new Paragraph({children:[new TextRun({text:'附件说明：',bold:true}),new TextRun('客户上传的 Word、PDF、图片、数据或结构文件与本需求单共同构成项目评估依据。')]}),
    new Paragraph({children:[new TextRun({text:'说明：',bold:true}),new TextRun('本表用于需求沟通与初步评估，最终技术方案、价格、周期和交付内容以双方确认结果为准。')]}),
  ]}]});
  return Packer.toBuffer(doc);
}
module.exports={buildRequirementDocx,titleFor};
